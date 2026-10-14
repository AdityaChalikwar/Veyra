"use client";

import { ArrowRight } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EvidenceRoleBadge } from "@/components/ui/EvidenceRoleBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { cn } from "@/lib/cn";
import type { Finding } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

/**
 * A finding as an evidence card: the statement, then exactly where it comes
 * from — source, dataset, period, observed change and confidence.
 */
export function FindingCard({ finding: f, compact }: { finding: Finding; compact?: boolean }) {
  const { workspace, openDetail } = useWorkspace();
  const evidence = workspace.evidence.find((e) => e.id === f.evidenceIds[0]);
  const open = () => openDetail({ type: "finding", id: f.id });
  const observed = f.observed?.values || (f.detail ? `${f.detail.before.value} → ${f.detail.after.value}` : null);
  const contradicted = f.evidenceLinks?.some((l) => l.relation === "contradicts");
  // One dataset: open it straight away. Several: the finding lists them all.
  const viewEvidence = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (evidence && f.evidenceIds.length === 1 && !contradicted) openDetail({ type: "evidence", id: evidence.id });
    else open();
  };
  const derived = f.kind !== "observation";

  const period = f.observed?.period || evidence?.coverage;
  const more = f.evidenceIds.length - 1;
  const meta: [string, React.ReactNode][] = [
    ["Evidence", `${evidence?.source ?? "—"}${more > 0 ? ` +${more} more` : ""}`],
    ["Dataset", [evidence?.dataset ?? evidence?.name ?? "—", !compact && period].filter(Boolean).join(" · ")],
    ...(observed
      ? [
          [
            "Observed",
            <>
              <span className="font-semibold">{observed}</span>
              {f.observed?.measure && <span className="text-ink-subtle"> · {f.observed.measure}</span>}
            </>,
          ] as [string, React.ReactNode],
        ]
      : []),
    ...(evidence?.confidence ? [["Evidence confidence", <ConfidenceBadge key="c" level={evidence.confidence} bare className="-ml-1.5 bg-transparent py-0" />] as [string, React.ReactNode]] : []),
  ];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
      className={cn(
        "group cursor-pointer rounded-xl border bg-surface shadow-card transition-shadow hover:shadow-raised",
        derived ? "border-dashed border-brand-200" : "border-line",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <KindBadge kind={f.kind} />
        <ConfidenceBadge level={f.confidence} />
        {derived && <EvidenceRoleBadge role="requires-validation" />}
      </div>
      <h3 className={cn("mt-2 font-semibold leading-snug", compact ? "text-[14px]" : "text-[15px]")}>{f.statement}</h3>
      {!compact && <p className="mt-1 text-[13px] text-ink-subtle">{f.confidenceReason}</p>}
      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs">
        {meta.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="pt-px text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">{k}</dt>
            <dd className="min-w-0 break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={viewEvidence} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
          View evidence{f.evidenceIds.length > 1 ? ` (${f.evidenceIds.length})` : ""} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
        {contradicted && <span className="text-[11px] font-medium text-uncertain-600">Some evidence contradicts this</span>}
      </div>
    </article>
  );
}
