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
  const observed = f.detail ? `${f.detail.before.value} → ${f.detail.after.value}` : null;
  const derived = f.kind !== "observation";

  const meta: [string, string][] = [
    ["Source", f.evidenceIds.length > 1 ? `${evidence?.source ?? "—"} +${f.evidenceIds.length - 1}` : (evidence?.source ?? "—")],
    ["Dataset", evidence?.dataset ?? evidence?.name ?? "—"],
    ...(!compact && evidence?.coverage ? [["Period", evidence.coverage] as [string, string]] : []),
    ...(observed ? [["Observed change", observed] as [string, string]] : []),
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
      <dl className={cn("mt-3 grid gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {meta.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">{k}</dt>
            <dd className="truncate text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
        View evidence <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </p>
    </article>
  );
}
