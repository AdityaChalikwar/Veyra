import { cn } from "@/lib/cn";
import type { EvidenceStrength } from "@/lib/types";

/** How much evidence stands behind a claim — shown separately from confidence. */
const config: Record<EvidenceStrength, { steps: number; label: string; tone: string }> = {
  strong: { steps: 3, label: "Strong", tone: "text-confirmed-600" },
  moderate: { steps: 2, label: "Moderate", tone: "text-brand-700" },
  weak: { steps: 1, label: "Weak", tone: "text-uncertain-600" },
};

export function EvidenceStrengthBadge({ strength, bare, className }: { strength: EvidenceStrength; bare?: boolean; className?: string }) {
  const c = config[strength];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium", c.tone, className)}>
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-full bg-current", i >= c.steps && "opacity-20")} style={{ height: 5 + i * 2.5 }} />
        ))}
      </span>
      {c.label}
      {!bare && " evidence"}
    </span>
  );
}
