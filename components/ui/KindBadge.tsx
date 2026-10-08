import { cn } from "@/lib/cn";
import type { ArtifactKind } from "@/lib/types";

/**
 * Labels what kind of claim a piece of content is. Veyra never lets a
 * hypothesis look like a fact, or an interpretation look like an observation.
 */
const styles: Record<ArtifactKind, string> = {
  fact: "border-confirmed-200 bg-confirmed-50 text-confirmed-600",
  observation: "border-confirmed-200 bg-confirmed-50 text-confirmed-600",
  finding: "border-brand-200 bg-brand-50 text-brand-700",
  interpretation: "border-brand-200 bg-brand-50 text-brand-700",
  insight: "border-violet-200 bg-violet-50 text-violet-700",
  hypothesis: "border-uncertain-200 bg-uncertain-50 text-uncertain-600",
  recommendation: "border-violet-200 bg-violet-50 text-violet-700",
  unknown: "border-dashed border-slate-300 bg-slate-50 text-slate-600",
  "open-question": "border-dashed border-slate-300 bg-slate-50 text-slate-600",
};

const labels: Record<ArtifactKind, string> = {
  fact: "Fact",
  observation: "Observation",
  finding: "Finding",
  interpretation: "Interpretation",
  insight: "Insight",
  hypothesis: "Hypothesis",
  recommendation: "Recommendation",
  unknown: "Unknown",
  "open-question": "Open question",
};

export function KindBadge({ kind, className }: { kind: ArtifactKind; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider",
        styles[kind],
        className,
      )}
    >
      {labels[kind]}
    </span>
  );
}
