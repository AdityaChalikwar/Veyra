"use client";

import { Info } from "lucide-react";
import { HypothesisCard } from "./HypothesisCard";
import { useWorkspace } from "./workspace-context";

export function HypothesesView() {
  const { workspace } = useWorkspace();
  return (
    <div className="mt-6">
      <div className="mb-5 flex gap-2.5 rounded-xl border border-uncertain-200 bg-uncertain-50 px-4 py-3 text-[13px] text-uncertain-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <b className="font-semibold">These are hypotheses, not conclusions.</b> Each is a possible explanation with its evidence
          strength and confidence shown separately. It stays open until it&rsquo;s validated.
        </p>
      </div>
      <h2 className="mb-3 text-[15px] font-semibold">Active Hypotheses</h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {workspace.hypotheses.map((h) => (
          <HypothesisCard key={h.id} hypothesis={h} />
        ))}
      </div>
    </div>
  );
}
