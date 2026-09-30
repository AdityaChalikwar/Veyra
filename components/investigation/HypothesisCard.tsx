"use client";

import { ChevronRight, FlaskConical } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import type { Hypothesis } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

/** A possible explanation. Styled with an amber edge so it never reads as an established fact. */
export function HypothesisCard({ hypothesis: h, rank }: { hypothesis: Hypothesis; rank: number }) {
  const { openDetail } = useWorkspace();
  const open = () => openDetail({ type: "hypothesis", id: h.id });
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
      className="group cursor-pointer rounded-xl border border-l-[3px] border-line border-l-uncertain-200 bg-surface p-5 shadow-card transition-shadow hover:shadow-raised"
    >
      <div className="flex items-start gap-3.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-uncertain-600/50 text-[13px] font-semibold text-uncertain-600">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind="hypothesis" />
            <ConfidenceBadge level={h.confidence} />
            <span className="text-[11px] text-ink-faint">Not yet confirmed</span>
          </div>
          <h3 className="mt-2 text-[15px] font-semibold leading-snug">{h.statement}</h3>
          <p className="mt-1 text-[13px] text-ink-subtle">{h.rationale}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-subtle">
            <span>
              Supported by <b className="font-semibold text-ink">{h.supportingFindingIds.length}</b> finding
              {h.supportingFindingIds.length === 1 ? "" : "s"}
            </span>
            <span>
              Challenged by <b className="font-semibold text-ink">{h.contradictingFindingIds.length}</b>
            </span>
          </div>
          {h.nextTest && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-muted">
              <FlaskConical className="mt-px h-3.5 w-3.5 shrink-0 text-brand-600" />
              <span>
                <span className="font-medium text-ink">Next test:</span> {h.nextTest}
              </span>
            </p>
          )}
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </div>
    </article>
  );
}
