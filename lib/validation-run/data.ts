import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { profileCsv } from "@/lib/analysis/profile";
import { getConnector } from "@/lib/connectors";
import { getEntity, type FieldMapping } from "@/lib/data-layer/canonical";
import { normalize } from "@/lib/data-layer/normalize";
import type { Database } from "@/lib/supabase/database.types";
import type { Table } from "./tests";

/**
 * The actual rows behind a piece of evidence, for Veyra's tests. Evidence only
 * stores a profile; the rows are read again on demand: an uploaded file from
 * private storage, a connected dataset from its source (with the team's
 * confirmed field mapping, as when it was synced).
 */
export async function loadTable(supabase: SupabaseClient<Database>, evidenceId: string): Promise<{ table: Table; name: string } | { error: string }> {
  const { data: e } = await supabase.from("evidence").select("id, name, file_id, snapshot_id").eq("id", evidenceId).maybeSingle();
  if (!e) return { error: "That dataset is no longer in the investigation." };

  if (e.file_id) {
    const { data: file } = await supabase.from("files").select("storage_path").eq("id", e.file_id).maybeSingle();
    if (!file) return { error: "The uploaded file is gone." };
    const { data: blob, error } = await supabase.storage.from("uploads").download(file.storage_path);
    if (error || !blob) return { error: "Couldn't read the uploaded file." };
    const parsed = profileCsv(await blob.text());
    return parsed.ok && parsed.table ? { table: parsed.table, name: e.name } : { error: "Couldn't read the uploaded file." };
  }

  if (e.snapshot_id) {
    const { data: snap } = await supabase.from("dataset_snapshots").select("source_dataset_id").eq("id", e.snapshot_id).maybeSingle();
    if (!snap) return { error: "The synced dataset is gone. Sync the source again." };
    const { data: ds } = await supabase.from("source_datasets").select("key, entity, mapping, data_source_id").eq("id", snap.source_dataset_id).maybeSingle();
    const { data: source } = ds ? await supabase.from("data_sources").select("connector").eq("id", ds.data_source_id).maybeSingle() : { data: null };
    const connector = source && getConnector(source.connector);
    const entity = ds?.entity ? getEntity(ds.entity) : undefined;
    if (!ds || !connector || !entity) return { error: "The data source for this dataset is no longer connected." };
    const result = normalize(entity, ds.mapping as FieldMapping, await connector.read(ds.key));
    if (!result.usable) return { error: "The dataset's field mapping no longer works." };
    const headers = entity.fields.map((f) => f.key);
    return {
      name: e.name,
      table: { headers, rows: result.rows.map((r) => headers.map((h) => (r[h] === null || r[h] === undefined ? "" : String(r[h])))) },
    };
  }
  return { error: "This evidence has no rows Veyra can read." };
}
