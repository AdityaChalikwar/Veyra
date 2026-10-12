import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ConnectedSource, DataCheck, DataMetric, SnapshotView, SourceDatasetView } from "@/lib/types";

/** Connected data sources, read as the signed-in user (RLS keeps them to their workspace). */

const SOURCE_COLUMNS =
  "id, kind, connector, name, status, last_synced_at, created_at, source_datasets (id, key, name, description, approx_rows, selected, entity, schema, mapping, mapping_confirmed_at, dataset_snapshots (id, name, source_name, entity, row_count, rejected_count, coverage, summary, checks, metrics, created_at))";

type SnapshotRow = {
  id: string;
  name: string;
  source_name: string;
  entity: string;
  row_count: number;
  rejected_count: number;
  coverage: string | null;
  summary: string;
  checks: unknown;
  metrics: unknown;
  created_at: string;
};

export function toSnapshot(s: SnapshotRow): SnapshotView {
  return {
    id: s.id,
    name: s.name,
    sourceName: s.source_name,
    entity: s.entity,
    rowCount: s.row_count,
    rejectedCount: s.rejected_count,
    coverage: s.coverage ?? undefined,
    summary: s.summary,
    checks: (s.checks ?? []) as DataCheck[],
    metrics: (s.metrics ?? []) as DataMetric[],
    createdAt: s.created_at,
  };
}

type SourceRow = {
  id: string;
  kind: string;
  connector: string;
  name: string;
  status: string;
  last_synced_at: string | null;
  created_at: string;
  source_datasets: {
    id: string;
    key: string;
    name: string;
    description: string;
    approx_rows: number;
    selected: boolean;
    entity: string | null;
    schema: unknown;
    mapping: unknown;
    mapping_confirmed_at: string | null;
    dataset_snapshots: SnapshotRow[];
  }[];
};

function toSource(row: SourceRow): ConnectedSource {
  return {
    id: row.id,
    kind: row.kind,
    connector: row.connector,
    name: row.name,
    status: row.status === "error" ? "error" : "connected",
    lastSyncedAt: row.last_synced_at ?? undefined,
    createdAt: row.created_at,
    datasets: [...row.source_datasets]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map<SourceDatasetView>((d) => {
        const latest = [...d.dataset_snapshots].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
        return {
          id: d.id,
          key: d.key,
          name: d.name,
          description: d.description,
          approxRows: d.approx_rows,
          selected: d.selected,
          entity: d.entity,
          schema: (d.schema ?? null) as SourceDatasetView["schema"],
          mapping: (d.mapping ?? {}) as Record<string, string | null>,
          mappingConfirmed: !!d.mapping_confirmed_at,
          latest: latest ? toSnapshot(latest) : undefined,
        };
      }),
  };
}

export const listConnectedSources = cache(async (): Promise<ConnectedSource[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("data_sources").select(SOURCE_COLUMNS).order("created_at");
  if (error) throw new Error(`Couldn't load data sources: ${error.message}`);
  return (data as unknown as SourceRow[]).map(toSource);
});

export async function getConnectedSource(id: string): Promise<ConnectedSource | undefined> {
  return (await listConnectedSources()).find((s) => s.id === id);
}

/** The newest snapshot of every synced dataset: what can be added to an investigation. */
export async function listAvailableSnapshots(): Promise<SnapshotView[]> {
  return (await listConnectedSources()).flatMap((s) => s.datasets.flatMap((d) => (d.latest ? [d.latest] : [])));
}
