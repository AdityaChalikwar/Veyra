import { ArrowDown, ClipboardList, Database, Flag, GitBranch, Target } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The hero visual: one investigation moving from problem to action.
 * It deliberately looks like a product artifact, not an illustration.
 */
const stages = [
  {
    label: "Problem",
    icon: Target,
    tint: "bg-danger-50 text-danger-600",
    text: "Our DAU dropped 40%.",
  },
  {
    label: "Evidence",
    icon: Database,
    tint: "bg-brand-50 text-brand-600",
    text: "Product Analytics · CRM · ERP · Support",
  },
  {
    label: "Understanding",
    icon: GitBranch,
    tint: "bg-uncertain-50 text-uncertain-600",
    text: "Activation −31% · retention stable · 3 hypotheses",
  },
  {
    label: "Problem",
    icon: Flag,
    tint: "bg-violet-50 text-violet-700",
    text: "New users fail to activate after the onboarding change.",
  },
  {
    label: "Next step",
    icon: ClipboardList,
    tint: "bg-confirmed-50 text-confirmed-600",
    text: "Interview 8 new users before choosing a solution",
  },
] as const;

export function FlowVisual({ className }: { className?: string }) {
  return (
    <div className={cn("w-full rounded-2xl border border-line bg-surface p-4 shadow-raised sm:p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">DAU Decline Investigation</p>
          <p className="text-xs text-ink-subtle">Acme · Consumer subscription app</p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
          Diagnosing · 72%
        </span>
      </div>

      <ol className="space-y-1">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <li key={stage.label}>
              <div className="flex items-center gap-3 rounded-xl border border-line/70 bg-canvas/60 px-3 py-2.5">
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", stage.tint)}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">{stage.label}</p>
                  <p className="text-[13px] text-ink sm:truncate">{stage.text}</p>
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className="flex justify-start py-0.5 pl-[22px]" aria-hidden="true">
                  <ArrowDown className="h-3.5 w-3.5 text-ink-faint" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
