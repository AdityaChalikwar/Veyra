"use client";

import { ArrowDown, Target } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { FindingChip } from "./ArtifactChips";
import { useWorkspace } from "./workspace-context";

/**
 * Problem definition: how the evidence reshapes the original problem.
 * This stays a problem statement — solutions come later, under Opportunities.
 */
export function ProblemView() {
  const { workspace } = useWorkspace();
  const p = workspace.problem;
  const facets: [string, string][] = [
    ["Who is affected", p.whoIsAffected],
    ["What they're trying to do", p.tryingTo],
    ["What's getting in the way", p.inTheWay],
    ["Business consequence", p.consequence],
  ];

  return (
    <div className="mt-6 max-w-4xl space-y-4">
      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Original problem</p>
        <p className="mt-1 text-lg text-ink-muted line-through decoration-ink-faint/40">&ldquo;{p.original}&rdquo;</p>
      </section>

      <div className="flex justify-center" aria-hidden="true">
        <ArrowDown className="h-4 w-4 text-ink-faint" />
      </div>

      <section className="rounded-xl border border-uncertain-200 bg-uncertain-50/50 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-uncertain-600">What the evidence suggests</p>
        <p className="mt-1 text-[14.5px] leading-relaxed text-ink">{p.whatEvidenceSuggests}</p>
      </section>

      <div className="flex justify-center" aria-hidden="true">
        <ArrowDown className="h-4 w-4 text-ink-faint" />
      </div>

      <section className="rounded-xl border-2 border-brand-200 bg-surface p-5 shadow-raised sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            <Target className="h-4 w-4" /> Refined problem
          </p>
          <ConfidenceBadge level={p.confidence} />
        </div>
        <p className="mt-2 text-lg font-semibold leading-snug sm:text-xl">&ldquo;{p.refined}&rdquo;</p>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {facets.map(([k, v]) => (
            <div key={k} className="rounded-lg bg-canvas px-3.5 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{k}</dt>
              <dd className="mt-0.5 text-[13.5px] text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Supporting evidence</p>
          <div className="flex flex-col items-start gap-1.5">
            {p.findingIds.map((id) => (
              <FindingChip key={id} id={id} />
            ))}
          </div>
        </div>
      </section>

      <p className="text-xs text-ink-subtle">
        This is a problem statement, not a solution. It says who is stuck and why it matters — deciding what to build comes after
        the problem is validated.
      </p>
    </div>
  );
}
