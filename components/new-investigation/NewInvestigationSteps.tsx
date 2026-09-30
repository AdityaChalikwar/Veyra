import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = ["Problem", "Clarify", "Investigate"] as const;

/** Where the user is in setting up a new investigation. */
export function NewInvestigationSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2 text-xs" aria-label="New investigation progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-5 bg-line-strong sm:w-8" aria-hidden="true" />}
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
              <span className="hidden sm:inline">{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
