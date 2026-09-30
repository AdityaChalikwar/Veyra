"use client";

import { AlertTriangle, ChevronDown, Info, Lightbulb } from "lucide-react";
import { useState } from "react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EvidenceStrengthBadge } from "@/components/ui/EvidenceStrengthBadge";
import { cn } from "@/lib/cn";
import type { Opportunity } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

const levelLabel = { low: "Low", medium: "Medium", high: "High" } as const;

/**
 * Opportunity areas (not features), then solution directions for them, then a
 * reasoned comparison. Veyra never picks a winner — the PM decides.
 */
export function OpportunitiesView() {
  const { workspace } = useWorkspace();
  return (
    <div className="mt-6 space-y-6">
      <div className="flex gap-2.5 rounded-xl border border-uncertain-200 bg-uncertain-50 px-4 py-3 text-[13px] text-uncertain-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <b className="font-semibold">Provisional.</b> These opportunities follow from a problem with {workspace.problem.confidence} confidence.
          They&rsquo;re areas worth solving for, not features — and Veyra recommends validating the problem before committing to any of them.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold">Opportunity areas</h2>
        <div className="space-y-3">
          {workspace.opportunities.map((o, i) => (
            <OpportunityCard key={o.id} opportunity={o} index={i + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}

function OpportunityCard({ opportunity: o, index }: { opportunity: Opportunity; index: number }) {
  const [showReasoning, setShowReasoning] = useState(false);
  return (
    <article className="rounded-xl border border-line bg-surface shadow-card">
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Opportunity {index}</p>
        <h3 className="mt-1 text-[16px] font-semibold">{o.title}</h3>
        <p className="mt-1 text-[13.5px] text-ink-muted">{o.description}</p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <div>
            <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Evidence</dt>
            <dd>
              <EvidenceStrengthBadge strength={o.evidenceStrength} bare />
            </dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Potential impact</dt>
            <dd className="text-[13px] font-semibold">{levelLabel[o.impact]}</dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Confidence</dt>
            <dd>
              <ConfidenceBadge level={o.confidence} bare className="-ml-1.5 bg-transparent" />
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => setShowReasoning((s) => !s)}
          aria-expanded={showReasoning}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showReasoning && "rotate-180")} />
          {showReasoning ? "Hide prioritisation reasoning" : "Show prioritisation reasoning"}
        </button>
        {showReasoning && (
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {o.assessment.map((a) => (
              <div key={a.criterion} className="rounded-lg bg-canvas px-3 py-2.5">
                <dt className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-ink-subtle">{a.criterion}</span>
                  <span className="font-semibold text-ink">{a.rating}</span>
                </dt>
                <dd className="mt-1 text-[12.5px] leading-snug text-ink-muted">{a.reasoning}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="border-t border-line bg-canvas/40 p-5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          <Lightbulb className="h-3.5 w-3.5" /> Possible solution directions
        </p>
        {o.ideas.length ? (
          <>
            <p className="mt-1 text-xs text-ink-subtle">Not ranked. Each rests on assumptions worth testing.</p>
            <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {o.ideas.map((idea) => (
                <li key={idea.id} className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-[14px] font-semibold">{idea.title}</p>
                  <dl className="mt-2 space-y-1.5 text-[12.5px]">
                    <Row label="Problem addressed" value={idea.problemAddressed} />
                    <Row label="Evidence" value={idea.evidence} />
                    <Row label="Expected impact" value={levelLabel[idea.expectedImpact]} />
                    <Row label="Assumptions" value={idea.assumptions.join(" ")} />
                  </dl>
                  <p className="mt-2 flex gap-1.5 text-[12.5px] text-uncertain-600">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {idea.risks.join(" ")}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-[13px] text-ink-subtle">Not explored yet. Veyra will suggest directions once the evidence behind this opportunity is stronger.</p>
        )}
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline text-ink-subtle">{label}: </dt>
      <dd className="inline text-ink">{value}</dd>
    </div>
  );
}
