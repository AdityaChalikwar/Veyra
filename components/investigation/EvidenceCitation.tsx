"use client";

import { ArrowRight } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EvidenceFormatIcon } from "@/components/evidence/EvidenceFormatIcon";
import { cn } from "@/lib/cn";
import type { EvidenceRelation, EvidenceStatus } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

const relationStyle: Record<EvidenceRelation, { label: string; className: string }> = {
  supports: { label: "Supports", className: "bg-confirmed-50 text-confirmed-600" },
  contradicts: { label: "Contradicts", className: "bg-uncertain-50 text-uncertain-600" },
  insufficient: { label: "Can't tell", className: "border border-dashed border-slate-300 text-slate-600" },
};

export function RelationBadge({ relation }: { relation: EvidenceRelation }) {
  const r = relationStyle[relation];
  return <span className={cn("inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide", r.className)}>{r.label}</span>;
}

const statusStyle: Record<EvidenceStatus, { label: string; className: string }> = {
  supported: { label: "Evidence supports it", className: "bg-confirmed-50 text-confirmed-600" },
  contradicted: { label: "Evidence contradicts it", className: "bg-uncertain-50 text-uncertain-600" },
  mixed: { label: "Evidence is mixed", className: "bg-brand-50 text-brand-700" },
  insufficient: { label: "Insufficient evidence", className: "border border-dashed border-slate-300 text-slate-600" },
};

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  const s = statusStyle[status];
  return <span className={cn("inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium", s.className)}>{s.label}</span>;
}

/**
 * One evidence item cited by a finding or hypothesis: where it comes from, the
 * period, what it shows, how far to trust it, and a way to open it.
 */
export function EvidenceCitation({ evidenceId, relation, shows }: { evidenceId: string; relation?: EvidenceRelation; shows?: string }) {
  const { workspace, openDetail } = useWorkspace();
  const e = workspace.evidence.find((x) => x.id === evidenceId);
  if (!e) return null;
  return (
    <li className="rounded-lg border border-line px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <EvidenceFormatIcon format={e.format} className="h-8 w-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {relation && <RelationBadge relation={relation} />}
            <p className="min-w-0 break-words text-[13px] font-medium text-ink">{e.name}</p>
          </div>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {e.source}
            {e.coverage && ` · ${e.coverage}`}
          </p>
          {shows && <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{shows}</p>}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {e.confidence ? <ConfidenceBadge level={e.confidence} className="-ml-0.5" /> : <span />}
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                openDetail({ type: "evidence", id: evidenceId });
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View evidence <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
