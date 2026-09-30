import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { cn } from "@/lib/cn";
import type { Confidence, Level } from "@/lib/types";

const levelLabel: Record<Level, string> = { low: "Low", medium: "Medium", high: "High" };

/** Expected impact, effort, risk and confidence side by side. Neutral styling: no option is painted "good" or "bad". */
export function LevelTiles({
  impact,
  effort,
  risk,
  confidence,
  compact,
}: {
  impact: Level;
  effort: Level;
  risk: Level;
  confidence: Confidence;
  compact?: boolean;
}) {
  const tiles: [string, React.ReactNode][] = [
    ["Expected Impact", levelLabel[impact]],
    ["Effort", levelLabel[effort]],
    ["Risk", levelLabel[risk]],
    ["Confidence", <ConfidenceBadge key="c" level={confidence} bare className="-ml-1.5 bg-transparent text-[13px]" />],
  ];
  return (
    <dl className={cn("grid grid-cols-2 gap-2", !compact && "sm:grid-cols-4")}>
      {tiles.map(([label, value]) => (
        <div key={label} className={cn("rounded-lg border border-line bg-canvas/60", compact ? "px-2.5 py-1.5" : "px-3 py-2.5")}>
          <dt className="text-[11px] text-ink-subtle">{label}</dt>
          <dd className={cn("font-semibold text-ink", compact ? "text-[13px]" : "mt-0.5 text-[15px]")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
