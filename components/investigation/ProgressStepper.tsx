import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { InvestigationStage } from "@/lib/types";

const STAGES: { id: InvestigationStage; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "evidence", label: "Evidence" },
  { id: "analysis", label: "Analysis" },
  { id: "diagnosis", label: "Diagnosis" },
  { id: "recommendation", label: "Recommendation" },
  { id: "action", label: "Action" },
];

/** The investigation lifecycle, with the current stage highlighted. */
export function ProgressStepper({ current }: { current: InvestigationStage }) {
  const currentIndex = STAGES.findIndex((s) => s.id === current);
  return (
    <ol className="flex w-full items-start" aria-label="Investigation progress">
      {STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={stage.id} className="relative flex flex-1 flex-col items-center" aria-current={active ? "step" : undefined}>
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn("absolute right-1/2 top-[9px] h-0.5 w-full", i <= currentIndex ? "bg-brand-600" : "bg-line")}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid h-5 w-5 place-items-center rounded-full",
                done && "bg-brand-600 text-white",
                active && "bg-white ring-[5px] ring-brand-600/90",
                !done && !active && "border-2 border-line-strong bg-surface",
              )}
            >
              {done && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span
              className={cn(
                "mt-2 whitespace-nowrap text-center text-[11px] leading-tight sm:text-xs",
                active ? "font-semibold text-ink" : done ? "text-ink-muted" : "text-ink-faint",
                // On phones only the current stage is labelled, so labels never collide.
                !active && "sr-only sm:not-sr-only",
              )}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
