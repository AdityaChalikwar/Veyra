"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth";
import { getConnector } from "@/lib/connectors";
import { getEntity, suggestEntity, suggestMapping, type EntityKey, type FieldMapping } from "@/lib/data-layer/canonical";
import { computeMetrics } from "@/lib/data-layer/metrics";
import { normalize, profileNormalized, type NormalizedRow } from "@/lib/data-layer/normalize";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { DEMO_CONTEXT } from "@/lib/connectors/demo-erp/context";
import type { DataCheck } from "@/lib/types";

type Result<T = object> = ({ ok: true } & T) | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const done = () => revalidatePath("/", "layout");

/**
 * Connects the Demo ERP: creates the source and discovers its datasets, with
 * a suggested Veyra entity and field mapping for each. Nothing is selected
 * or synced yet. The business context always switches to the demo company
 * while it's connected, so the AI only ever sees one company (the team's own
 * is kept and restored on disconnect).
 */
export async function connectDemoErp(): Promise<Result<{ id: string }>> {
  const { company } = await requireWorkspace();
  const supabase = await createClient();
  const connector = getConnector("demo-erp")!;

  const { data: existing } = await supabase.from("data_sources").select("id").eq("connector", "demo-erp").maybeSingle();
  if (existing) return { ok: true, id: existing.id };

  const { data: source, error } = await supabase
    .from("data_sources")
    .insert({ workspace_id: company.id, kind: connector.kind, connector: connector.id, name: "Demo ERP — Northwind Home" })
    .select("id")
    .single();
  if (error || !source) return { error: "Couldn't connect the Demo ERP. Try again in a moment." };

  const datasets = await connector.listDatasets();
  const rows = await Promise.all(
    datasets.map(async (d) => {
      const schema = await connector.describe(d.key);
      const entity = suggestEntity(d.key, d.name);
      const e = entity ? getEntity(entity) : undefined;
      return {
        data_source_id: source.id,
        workspace_id: company.id,
        key: d.key,
        name: d.name,
        description: d.description,
        approx_rows: d.approxRows,
        entity,
        schema: schema as unknown as Json,
        mapping: (e ? suggestMapping(e, schema.fields) : {}) as Json,
      };
    }),
  );
  const { error: dsError } = await supabase.from("source_datasets").insert(rows);
  if (dsError) {
    await supabase.from("data_sources").delete().eq("id", source.id);
    return { error: "Couldn't read the Demo ERP's datasets. Try again in a moment." };
  }
  await switchToDemoContext(company.id, source.id);
  done();
  return { ok: true, id: source.id };
}

type ContextRow = Pick<Tables<"business_contexts">, "company_name" | "product" | "business_model" | "target_customers" | "goals" | "priorities" | "key_metrics">;
const CONTEXT_COLUMNS = "company_name, product, business_model, target_customers, goals, priorities, key_metrics";

/** Puts Northwind Home's context in place, keeping the team's own on the data source to restore later. */
async function switchToDemoContext(workspaceId: string, sourceId: string) {
  const supabase = await createClient();
  const { data: own } = await supabase.from("business_contexts").select(CONTEXT_COLUMNS).eq("workspace_id", workspaceId).maybeSingle();
  if (own && own.company_name !== DEMO_CONTEXT.company) {
    await supabase
      .from("data_sources")
      .update({ settings: { contextSwitched: true, savedContext: own } as unknown as Json })
      .eq("id", sourceId);
  } else {
    await supabase.from("data_sources").update({ settings: { contextSwitched: true } }).eq("id", sourceId);
  }
  await supabase
    .from("business_contexts")
    .update({
      company_name: DEMO_CONTEXT.company,
      product: DEMO_CONTEXT.product,
      business_model: DEMO_CONTEXT.businessModel,
      target_customers: DEMO_CONTEXT.targetCustomers,
      goals: DEMO_CONTEXT.goals,
      priorities: DEMO_CONTEXT.priorities,
      key_metrics: DEMO_CONTEXT.keyMetrics,
    })
    .eq("workspace_id", workspaceId);
}

/**
 * The whole Demo ERP set-up in one go: connect, choose every dataset, accept
 * the suggested field mappings, and sync. Used by "Try with demo data".
 */
export async function setUpDemo(): Promise<Result<{ id: string }>> {
  await requireWorkspace();
  const connected = await connectDemoErp();
  if ("error" in connected) return connected;
  const supabase = await createClient();
  const { data: datasets } = await supabase.from("source_datasets").select("id, entity, mapping").eq("data_source_id", connected.id);
  const usable = (datasets ?? []).filter((d) => {
    const e = d.entity ? getEntity(d.entity) : undefined;
    const m = d.mapping as FieldMapping;
    return e && e.fields.every((f) => !f.required || m[f.key]);
  });
  if (!usable.length) return { error: "Couldn't set up the demo data. Try the step-by-step set-up on Data Sources." };
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("source_datasets")
    .update({ selected: true, mapping_confirmed_at: now })
    .in("id", usable.map((d) => d.id));
  if (error) return { error: "Couldn't set up the demo data. Try again in a moment." };
  const synced = await syncSource(connected.id);
  if ("error" in synced) return synced;
  return { ok: true, id: connected.id };
}

/** Which datasets of a source to bring into Veyra. */
export async function selectDatasets(sourceId: string, datasetIds: string[]): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(sourceId) || !datasetIds.every((d) => UUID.test(d))) return { error: "Something went wrong. Reload the page and try again." };
  if (!datasetIds.length) return { error: "Choose at least one dataset." };
  const supabase = await createClient();
  const { error: off } = await supabase.from("source_datasets").update({ selected: false }).eq("data_source_id", sourceId);
  const { error: on } = await supabase.from("source_datasets").update({ selected: true }).eq("data_source_id", sourceId).in("id", datasetIds);
  if (off || on) return { error: "Couldn't save your choice. Try again in a moment." };
  done();
  return { ok: true };
}

/** Saves and confirms how a dataset's fields map onto a Veyra entity. */
export async function saveMapping(datasetId: string, entity: string, mapping: FieldMapping): Promise<Result> {
  await requireWorkspace();
  const e = getEntity(entity);
  if (!UUID.test(datasetId) || !e) return { error: "Choose what this dataset contains." };
  const supabase = await createClient();
  const { data: ds } = await supabase.from("source_datasets").select("schema").eq("id", datasetId).maybeSingle();
  if (!ds) return { error: "This dataset no longer exists." };
  const fields = new Set(((ds.schema as { fields?: { name: string }[] } | null)?.fields ?? []).map((f) => f.name));
  // Only Veyra fields of this entity, pointing at fields the source really has.
  const clean: FieldMapping = Object.fromEntries(e.fields.map((f) => [f.key, mapping[f.key] && fields.has(mapping[f.key]!) ? mapping[f.key] : null]));
  const { error } = await supabase
    .from("source_datasets")
    .update({ entity: e.key, mapping: clean as Json, mapping_confirmed_at: new Date().toISOString() })
    .eq("id", datasetId);
  if (error) return { error: "Couldn't save the mapping. Try again in a moment." };
  done();
  return { ok: true };
}

type DatasetRow = { id: string; key: string; name: string; entity: string | null; mapping: Json; mapping_confirmed_at: string | null };

async function loadSelected(sourceId: string) {
  const supabase = await createClient();
  const { data: source } = await supabase.from("data_sources").select("id, connector, name").eq("id", sourceId).maybeSingle();
  if (!source) return null;
  const { data: datasets } = await supabase
    .from("source_datasets")
    .select("id, key, name, entity, mapping, mapping_confirmed_at")
    .eq("data_source_id", sourceId)
    .eq("selected", true);
  const connector = getConnector(source.connector);
  return connector ? { supabase, source, connector, datasets: (datasets ?? []) as DatasetRow[] } : null;
}

/**
 * Validation: reads every selected dataset with its confirmed mapping and
 * reports what would be kept and left out. Nothing is saved.
 */
export async function checkSource(sourceId: string): Promise<Result<{ results: { datasetId: string; name: string; usable: boolean; checks: DataCheck[] }[] }>> {
  await requireWorkspace();
  if (!UUID.test(sourceId)) return { error: "Something went wrong. Reload the page and try again." };
  const loaded = await loadSelected(sourceId);
  if (!loaded) return { error: "This data source no longer exists." };
  const results = await Promise.all(
    loaded.datasets.map(async (d) => {
      const e = d.entity ? getEntity(d.entity) : undefined;
      if (!e || !d.mapping_confirmed_at) {
        return { datasetId: d.id, name: d.name, usable: false, checks: [{ level: "error", text: "Confirm the field mapping first." } as DataCheck] };
      }
      const r = normalize(e, d.mapping as FieldMapping, await loaded.connector.read(d.key));
      return { datasetId: d.id, name: d.name, usable: r.usable, checks: r.checks };
    }),
  );
  return { ok: true, results };
}

/**
 * Sync: reads, validates and normalizes every selected dataset, then saves a
 * snapshot of each — its profile and metrics, computed in code. Metrics that
 * need two datasets (return rates need orders and products) use everything
 * synced in the same run.
 */
export async function syncSource(sourceId: string): Promise<Result<{ snapshots: number }>> {
  const { company } = await requireWorkspace();
  if (!UUID.test(sourceId)) return { error: "Something went wrong. Reload the page and try again." };
  const loaded = await loadSelected(sourceId);
  if (!loaded) return { error: "This data source no longer exists." };
  const { supabase, source, connector, datasets } = loaded;
  const ready = datasets.filter((d) => d.entity && d.mapping_confirmed_at && getEntity(d.entity));
  if (!ready.length) return { error: "Choose datasets and confirm their field mapping first." };

  const { data: run, error: runError } = await supabase
    .from("sync_runs")
    .insert({ data_source_id: sourceId, workspace_id: company.id })
    .select("id")
    .single();
  if (runError || !run) return { error: "Couldn't start the sync. Try again in a moment." };

  try {
    const results = await Promise.all(
      ready.map(async (d) => {
        const e = getEntity(d.entity!)!;
        return { d, e, r: normalize(e, d.mapping as FieldMapping, await connector.read(d.key)) };
      }),
    );
    const usable = results.filter((x) => x.r.usable);
    const sets: Partial<Record<EntityKey, NormalizedRow[]>> = {};
    for (const x of usable) sets[x.e.key] = x.r.rows;

    const snapshots = usable.map(({ d, e, r }) => {
      const p = profileNormalized(e, r.rows);
      return {
        data_source_id: sourceId,
        source_dataset_id: d.id,
        sync_run_id: run.id,
        workspace_id: company.id,
        entity: e.key,
        name: d.name,
        source_name: source.name,
        row_count: r.rows.length,
        rejected_count: r.rejected,
        coverage: p.coverage ?? null,
        summary: p.summary,
        profile: p.profile as unknown as Json,
        metrics: computeMetrics(e.key, sets) as unknown as Json,
        checks: r.checks as unknown as Json,
      };
    });
    if (snapshots.length) {
      const { error } = await supabase.from("dataset_snapshots").insert(snapshots);
      if (error) throw new Error(error.message);
    }
    const now = new Date().toISOString();
    await supabase
      .from("sync_runs")
      .update({
        status: "completed",
        finished_at: now,
        rows_read: results.reduce((a, x) => a + x.r.read, 0),
        rows_rejected: results.reduce((a, x) => a + x.r.rejected, 0),
        error: results.length > usable.length ? `${results.length - usable.length} dataset(s) couldn't be used.` : null,
      })
      .eq("id", run.id);
    await supabase.from("data_sources").update({ last_synced_at: now, status: "connected" }).eq("id", sourceId);
    done();
    return { ok: true, snapshots: snapshots.length };
  } catch (e) {
    console.error("sync failed", e);
    await supabase.from("sync_runs").update({ status: "failed", finished_at: new Date().toISOString(), error: "The sync didn't finish." }).eq("id", run.id);
    return { error: "The sync didn't finish. Try again in a moment." };
  }
}

/** Disconnects a source. Evidence already taken into investigations keeps its own copy. */
export async function disconnectSource(sourceId: string): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(sourceId)) return { error: "Something went wrong. Reload the page and try again." };
  const supabase = await createClient();

  // Leaving the demo puts the team's own business context back.
  const { data: source } = await supabase.from("data_sources").select("settings").eq("id", sourceId).maybeSingle();
  const settings = (source?.settings ?? {}) as { contextSwitched?: boolean; savedContext?: ContextRow };
  if (settings.contextSwitched) {
    const saved = settings.savedContext;
    await supabase
      .from("business_contexts")
      .update(
        saved ?? { company_name: "", product: "", business_model: "", target_customers: "", goals: [], priorities: [], key_metrics: [] },
      )
      .eq("workspace_id", company.id);
  }

  const { error, count } = await supabase.from("data_sources").delete({ count: "exact" }).eq("id", sourceId);
  if (error || !count) return { error: "Couldn't disconnect it. Try again in a moment." };
  done();
  return { ok: true };
}

/** Adds a synced dataset to an investigation as evidence, with its own copy of the profile and metrics. */
export async function addSnapshotEvidence(investigationId: string, snapshotId: string): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(investigationId) || !UUID.test(snapshotId)) return { error: "Something went wrong. Reload the page and try again." };
  const supabase = await createClient();
  const [{ data: inv }, { data: snap }] = await Promise.all([
    supabase.from("investigations").select("id, is_sample").eq("id", investigationId).maybeSingle(),
    supabase.from("dataset_snapshots").select("id, name, source_name, coverage, summary, profile, metrics").eq("id", snapshotId).maybeSingle(),
  ]);
  if (!inv || inv.is_sample) return { error: "This investigation can't take evidence." };
  if (!snap) return { error: "That dataset is no longer available. Sync it again." };
  const { error } = await supabase.from("evidence").insert({
    investigation_id: investigationId,
    workspace_id: company.id,
    snapshot_id: snap.id,
    name: snap.name,
    source: snap.source_name,
    format: "dataset",
    category: "company-data",
    coverage: snap.coverage,
    summary: snap.summary,
    profile: snap.profile,
    metrics: snap.metrics,
  });
  if (error) return { error: error.code === "23505" ? "That dataset is already in this investigation." : "Couldn't add it. Try again in a moment." };
  done();
  return { ok: true };
}

/** Removes evidence that came from a connected source (uploads are removed with their file). */
export async function removeSourceEvidence(evidenceId: string): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(evidenceId)) return { error: "Something went wrong. Reload the page and try again." };
  const supabase = await createClient();
  const { error, count } = await supabase.from("evidence").delete({ count: "exact" }).eq("id", evidenceId).is("file_id", null);
  if (error || !count) return { error: "Couldn't remove it. Try again in a moment." };
  done();
  return { ok: true };
}
