"use client";

import { Boxes, ChevronDown, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addSnapshotEvidence, removeSourceEvidence } from "@/app/(app)/data-sources/actions";
import { MetricTable } from "@/components/data-sources/MetricTable";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import type { SnapshotView, SourceEvidence } from "@/lib/types";

const OFFLINE = "Couldn't reach Veyra. Check your connection and try again.";

/**
 * Evidence from connected sources: what this investigation already uses, and
 * synced datasets that can be added. Each comes with metrics worked out in code.
 */
export function SourceEvidencePicker({
  investigationId,
  added,
  available,
}: {
  investigationId: string;
  added: SourceEvidence[];
  available: SnapshotView[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addedSnapshots = new Set(added.map((a) => a.snapshotId));
  const addable = available.filter((s) => !addedSnapshots.has(s.id));

  async function act(id: string, fn: () => Promise<{ ok: true } | { error: string }>) {
    setBusy(id);
    setError(null);
    try {
      const r = await fn();
      if ("error" in r) setError(r.error);
      else router.refresh();
    } catch {
      setError(OFFLINE);
    }
    setBusy(null);
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <Boxes className="h-4 w-4 text-brand-600" /> Add from your data
      </h2>
      <p className="mt-0.5 text-xs text-ink-subtle">
        Datasets synced from connected systems, with trends and breakdowns calculated over every row.
      </p>

      {added.length > 0 && (
        <ul className="mt-4 space-y-3">
          {added.map((e) => (
            <AddedCard key={e.evidenceId} evidence={e} busy={busy === e.evidenceId} onRemove={() => act(e.evidenceId, () => removeSourceEvidence(e.evidenceId))} />
          ))}
        </ul>
      )}

      {addable.length > 0 ? (
        <>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Available to add</p>
          <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            {addable.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 rounded-lg border border-line px-3.5 py-3">
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium">{s.name}</span>
                  <span className="block text-xs text-ink-subtle">
                    {s.sourceName} · {s.rowCount.toLocaleString("en")} rows{s.coverage ? ` · ${s.coverage}` : ""}
                  </span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  aria-label={`Add ${s.name}`}
                  disabled={busy !== null}
                  onClick={() => act(s.id, () => addSnapshotEvidence(investigationId, s.id))}
                >
                  {busy === s.id ? <Spinner /> : <Plus className="h-3.5 w-3.5" />} Add
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        available.length === 0 && (
          <p className="mt-3 text-[13px] text-ink-subtle">
            No connected data yet.{" "}
            <Link href={routes.dataSources} className="font-medium text-brand-600 hover:text-brand-700">
              Connect a data source
            </Link>{" "}
            — the Demo ERP takes a minute to set up.
          </p>
        )
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger-600">
          {error}
        </p>
      )}
    </section>
  );
}

function AddedCard({ evidence: e, busy, onRemove }: { evidence: SourceEvidence; busy: boolean; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-line">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-1.5 text-[14px] font-medium">
            {e.name}
            <ChevronDown className={cn("h-3.5 w-3.5 text-ink-subtle transition-transform", open && "rotate-180")} />
          </span>
          <span className="block text-xs text-ink-subtle">
            {e.source}
            {e.coverage ? ` · ${e.coverage}` : ""} · {e.metrics.length} metrics · added {formatRelative(e.addedAt).toLowerCase()}
          </span>
        </button>
        <button type="button" onClick={onRemove} disabled={busy} aria-label={`Remove ${e.name}`} className="rounded-md p-1.5 text-ink-faint hover:bg-canvas hover:text-danger-600">
          {busy ? <Spinner /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="space-y-4 border-t border-line px-4 pb-4 pt-3">
          {e.summary && <p className="text-[13px] text-ink-muted">{e.summary}</p>}
          {e.metrics.map((m) => (
            <MetricTable key={m.id} metric={m} />
          ))}
        </div>
      )}
    </li>
  );
}
