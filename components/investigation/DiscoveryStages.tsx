import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DiscoveryStage } from "@/lib/types";

const statusText = { done: "Done", "in-progress": "In progress", pending: "Pending" } as const;

/**
 * This investigation's own discovery path. Stages come from the investigation
 * plan, so they differ between problems — it isn't a fixed checklist.
 */
export function DiscoveryStages({ stages }: { stages: DiscoveryStage[] }) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="Investigation progress">
      {stages.map((s, i) => (
        <li
          key={s.id}
          aria-current={s.status === "in-progress" ? "step" : undefined}
          className={cn(
            "flex items-start gap-2.5 rounded-lg border px-3 py-2.5",
            s.status === "in-progress" ? "border-brand-300 bg-brand-50/70" : "border-line bg-surface",
          )}
        >
          <span
            className={cn(
              "mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold",
              s.status === "done" && "bg-brand-600 text-white",
              s.status === "in-progress" && "bg-white text-brand-700 ring-2 ring-brand-600",
              s.status === "pending" && "border border-line-strong text-ink-faint",
            )}
          >
            {s.status === "done" ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
          </span>
          <span className="min-w-0">
            <span className={cn("block text-[12.5px] font-medium leading-snug", s.status === "pending" ? "text-ink-subtle" : "text-ink")}>
              {s.label}
            </span>
            <span className={cn("block text-[11px]", s.status === "in-progress" ? "text-brand-700" : "text-ink-faint")}>
              {statusText[s.status]}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
