"use client";

import { KindBadge } from "@/components/ui/KindBadge";
import { LevelTiles } from "./LevelTiles";
import { RecommendationCard } from "./RecommendationCard";
import { useWorkspace } from "./workspace-context";

export function RecommendationsView() {
  const { workspace } = useWorkspace();
  const primary = workspace.recommendations.find((r) => r.isPrimary);
  // Alternatives are listed alphabetically so their order doesn't imply a ranking.
  const alternatives = workspace.recommendations
    .filter((r) => !r.isPrimary)
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="mt-6 space-y-8">
      {primary && <RecommendationCard recommendation={primary} />}

      <section>
        <h2 className="text-[15px] font-semibold">Other options considered</h2>
        <p className="mt-1 text-[13px] text-ink-subtle">In alphabetical order, not ranked. Each has trade-offs worth knowing.</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {alternatives.map((r) => (
            <li key={r.id} className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card">
              <KindBadge kind="recommendation" className="w-fit opacity-80" />
              <h3 className="mt-2 text-[14.5px] font-semibold">{r.title}</h3>
              <p className="mt-1 flex-1 text-[13px] leading-relaxed text-ink-muted">{r.rationale}</p>
              <div className="mt-3">
                <LevelTiles impact={r.impact} effort={r.effort} risk={r.risk} confidence={r.confidence} compact />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
