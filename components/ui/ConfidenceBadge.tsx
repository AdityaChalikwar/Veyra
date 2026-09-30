import { cn } from "@/lib/cn";
import type { Confidence } from "@/lib/types";

/**
 * Confidence as a five-step meter plus words. Only "high" is green; lower
 * levels shift to amber so weak evidence never looks settled.
 */
const config: Record<Confidence, { steps: number; label: string; tone: string; bar: string }> = {
  high: { steps: 5, label: "High", tone: "bg-confirmed-50 text-confirmed-600", bar: "bg-confirmed-600" },
  "medium-high": { steps: 4, label: "Medium-high", tone: "bg-brand-50 text-brand-700", bar: "bg-brand-600" },
  medium: { steps: 3, label: "Medium", tone: "bg-brand-50 text-brand-700", bar: "bg-brand-500" },
  "low-medium": { steps: 2, label: "Low-medium", tone: "bg-uncertain-50 text-uncertain-600", bar: "bg-uncertain-600" },
  low: { steps: 1, label: "Low", tone: "bg-uncertain-50 text-uncertain-600", bar: "bg-uncertain-600" },
};

export function ConfidenceBadge({ level, bare, className }: { level: Confidence; /** Omit the word "confidence" where a label already says it. */ bare?: boolean; className?: string }) {
  const c = config[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium", c.tone, className)}>
      <span className="flex gap-[2px]" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn("h-2 w-[3px] rounded-full", i < c.steps ? c.bar : "bg-current opacity-20")} />
        ))}
      </span>
      {c.label}
      {!bare && " confidence"}
    </span>
  );
}
