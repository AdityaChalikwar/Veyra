"use client";

import { ChevronRight, CircleHelp, FlaskConical } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EvidenceStrengthBadge } from "@/components/ui/EvidenceStrengthBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { cn } from "@/lib/cn";
import type { Hypothesis } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

/** A possible explanation. Amber edge so it never reads as an established fact. */
export function HypothesisCard({ hypothesis: h, compact }: { hypothesis: Hypothesis; compact?: boolean }) {
  const { openDetail } = useWorkspace();
  const open = () => openDetail({ type: "hypothesis", id: h.id });
  const support = h.supportingFindingIds.length + (h.supportingEvidenceIds?.length ?? 0);
  const contra = h.contradictingFindingIds.length + (h.contradictingEvidenceIds?.length ?? 0);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
      className={cn(
        "group flex cursor-pointer flex-col rounded-xl border border-l-[3px] border-line bg-surface shadow-card transition-shadow hover:shadow-raised",
        compact ? "p-4" : "p-5",
        h.status === "confirmed" ? "border-l-confirmed-600" : h.status === "rejected" ? "border-l-slate-300 opacity-75" : "border-l-uncertain-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-dashed border-uncertain-600/50 px-1.5 text-[13px] font-semibold text-uncertain-600">{h.label}</span>
          <KindBadge kind="hypothesis" />
          {h.status === "confirmed" && <span className="rounded bg-confirmed-50 px-1.5 py-0.5 text-[11px] font-medium text-confirmed-600">Confirmed</span>}
          {h.status === "rejected" && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">Rejected</span>}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </div>
      <h3 className={cn("mt-2 font-semibold leading-snug", compact ? "text-[14px]" : "text-[15px]")}>{h.statement}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Evidence</dt>
          <dd>
            <EvidenceStrengthBadge strength={h.evidenceStrength} bare />
          </dd>
        </div>
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Confidence</dt>
          <dd>
            <ConfidenceBadge level={h.confidence} bare className="-ml-1.5 bg-transparent" />
          </dd>
        </div>
      </dl>
      {!compact && (
        <>
          <p className="mt-3 text-[13px] text-ink-muted">{h.rationale}</p>
          <p className="mt-3 text-xs text-ink-subtle">
            <b className="font-semibold text-confirmed-600">{support}</b> supporting · <b className="font-semibold text-uncertain-600">{contra}</b> contradicting
          </p>
          {h.openQuestions[0] && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-muted">
              <CircleHelp className="mt-px h-3.5 w-3.5 shrink-0 text-ink-faint" /> {h.openQuestions[0]}
            </p>
          )}
          <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-muted">
            <FlaskConical className="mt-px h-3.5 w-3.5 shrink-0 text-brand-600" />
            <span>
              <span className="font-medium text-ink">Validate by:</span> {h.validationMethod}
            </span>
          </p>
        </>
      )}
    </article>
  );
}
