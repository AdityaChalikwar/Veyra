import { cn } from "@/lib/cn";
import type { InvestigationStatus } from "@/lib/types";

const styles: Record<InvestigationStatus, string> = {
  planning: "bg-slate-100 text-slate-600",
  investigating: "bg-brand-50 text-brand-700",
  "customer-research": "bg-violet-50 text-violet-700",
  "problem-definition": "bg-violet-50 text-violet-700",
  "opportunity-discovery": "bg-brand-50 text-brand-700",
  validating: "bg-uncertain-50 text-uncertain-600",
  completed: "bg-slate-100 text-slate-600",
};

export const statusLabel: Record<InvestigationStatus, string> = {
  planning: "Planning",
  investigating: "Investigating",
  "customer-research": "Customer Research",
  "problem-definition": "Problem Definition",
  "opportunity-discovery": "Opportunity Discovery",
  validating: "Validating",
  completed: "Completed",
};

export function StatusBadge({ status, className }: { status: InvestigationStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {statusLabel[status]}
    </span>
  );
}
