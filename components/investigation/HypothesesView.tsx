"use client";

import { Info } from "lucide-react";
import { HypothesisCard } from "./HypothesisCard";
import { useWorkspace } from "./workspace-context";

export function HypothesesView() {
  const { workspace } = useWorkspace();
  return (
    <div className="mt-6 max-w-3xl">
      <div className="mb-4 flex gap-2.5 rounded-xl border border-uncertain-200 bg-uncertain-50 px-4 py-3 text-[13px] text-uncertain-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <b className="font-semibold">These are hypotheses, not conclusions.</b> They&rsquo;re possible explanations ranked by
          how well the current evidence supports them. Each one stays open until it&rsquo;s tested.
        </p>
      </div>
      <h2 className="mb-3 text-[15px] font-semibold">Top Hypotheses</h2>
      <div className="space-y-3">
        {workspace.hypotheses.map((h, i) => (
          <HypothesisCard key={h.id} hypothesis={h} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
