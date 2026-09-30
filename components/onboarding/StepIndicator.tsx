import { cn } from "@/lib/cn";

export function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs font-medium tabular-nums text-ink-subtle">
        Step {step} of {total}
      </p>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn("h-1.5 w-8 rounded-full transition-colors", i < step ? "bg-brand-600" : "bg-line")}
          />
        ))}
      </div>
    </div>
  );
}
