import { cn } from "@/lib/cn";
import type { InvestigationStatus } from "@/lib/types";

const styles: Record<InvestigationStatus, string> = {
  planning: "bg-slate-100 text-slate-600",
  investigating: "bg-brand-50 text-brand-700",
  diagnosing: "bg-violet-50 text-violet-700",
  recommendation: "bg-confirmed-50 text-confirmed-600",
  completed: "bg-slate-100 text-slate-600",
};

export const statusLabel: Record<InvestigationStatus, string> = {
  planning: "Planning",
  investigating: "Investigating",
  diagnosing: "Diagnosing",
  recommendation: "Recommendation",
  completed: "Completed",
};

/** Longer labels for cards, where there's room to say what the status means. */
const longLabel: Partial<Record<InvestigationStatus, string>> = {
  recommendation: "Recommendation Ready",
};

export function StatusBadge({
  status,
  long,
  className,
}: {
  status: InvestigationStatus;
  long?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {(long && longLabel[status]) || statusLabel[status]}
    </span>
  );
}
