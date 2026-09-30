import { cn } from "@/lib/cn";
import type { EvidenceRole } from "@/lib/types";

const config: Record<EvidenceRole, { label: string; className: string }> = {
  supporting: { label: "Supporting evidence", className: "bg-confirmed-50 text-confirmed-600" },
  contradicting: { label: "Contradicting evidence", className: "bg-uncertain-50 text-uncertain-600" },
  unknown: { label: "Unknown", className: "border border-dashed border-slate-300 text-slate-600" },
  "requires-validation": { label: "Requires validation", className: "bg-violet-50 text-violet-700" },
};

export function EvidenceRoleBadge({ role, className }: { role: EvidenceRole; className?: string }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide", config[role].className, className)}>
      {config[role].label}
    </span>
  );
}
