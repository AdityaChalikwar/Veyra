import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const NEW_INVESTIGATION_STEPS = ["Problem", "Context", "Evidence", "Questions", "Plan"] as const;

/** Where the user is in setting up a new investigation. */
export function NewInvestigationSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5 text-xs" aria-label="New investigation progress">
      {NEW_INVESTIGATION_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-1.5">
            {i > 0 && <span className="h-px w-3 bg-line-strong sm:w-5" aria-hidden="true" />}
            <span
              aria-current={active ? "step" : undefined}
              className={cn("flex items-center gap-1.5 font-medium", active ? "text-ink" : done ? "text-ink-muted" : "text-ink-faint")}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[10.5px]",
                  active && "bg-brand-600 text-white",
                  done && "bg-brand-100 text-brand-700",
                  !active && !done && "border border-line-strong",
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn(active ? "inline" : "hidden lg:inline")}>{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
