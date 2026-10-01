"use client";

import { Check, Compass, GitBranch, PauseCircle, Search, TestTube2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/time";
import type { NextStepType } from "@/lib/types";
import { ResearchTaskCard } from "./ResearchTaskCard";
import { useWorkspace } from "./workspace-context";

export const nextStepTypeLabel: Record<NextStepType, { label: string; icon: typeof Search; className: string }> = {
  research: { label: "Research", icon: Search, className: "bg-brand-50 text-brand-700" },
  analysis: { label: "Analysis", icon: Search, className: "bg-brand-50 text-brand-700" },
  validation: { label: "Validation", icon: TestTube2, className: "bg-violet-50 text-violet-700" },
  "solution-exploration": { label: "Solution exploration", icon: Compass, className: "bg-confirmed-50 text-confirmed-600" },
  hold: { label: "Hold", icon: PauseCircle, className: "bg-slate-100 text-slate-600" },
};

/**
 * The recommended next step. Often research or validation rather than
 * "build X" — Veyra investigates, the PM decides.
 */
export function NextStepView() {
  const { workspace, nextStepAcceptedAt, acceptNextStep } = useWorkspace();
  const step = workspace.nextStep;
  const type = nextStepTypeLabel[step.type];
  const Icon = type.icon;
  const tasks = workspace.researchTasks.filter((t) => step.researchTaskIds.includes(t.id));

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border-2 border-brand-200 bg-surface shadow-raised">
        <div className="border-b border-line p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">Recommended next step</span>
            <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium", type.className)}>
              <Icon className="h-3 w-3" /> {type.label}
            </span>
            <ConfidenceBadge level={step.confidence} />
          </div>
          <h2 className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{step.title}</h2>
          <p className="mt-1 text-[14px] text-ink">{step.detail}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-2">
          <div className="space-y-5">
            <Block title="Why this step">{step.why}</Block>
            {step.whyNotBuildYet && <Block title="Why not build something yet">{step.whyNotBuildYet}</Block>}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">What could change this</h3>
              <ul className="mt-2 space-y-2">
                {step.wouldChangeIf.map((c) => (
                  <li key={c} className="flex gap-2.5 rounded-lg border border-dashed border-uncertain-200 bg-uncertain-50/50 px-3 py-2 text-[13px]">
                    <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-uncertain-600" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">The research involved</h3>
            <div className="mt-2 space-y-2">
              {tasks.map((t) => (
                <ResearchTaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line bg-canvas/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="flex items-center gap-2 text-[13px] text-ink-muted">
            <UserCheck className="h-4 w-4 shrink-0 text-ink-subtle" />
            {nextStepAcceptedAt
              ? `Accepted ${formatRelative(nextStepAcceptedAt).toLowerCase()} and added to the Decision Log. The H1 validation has started.`
              : "Veyra recommends. You decide — accepting records the decision and starts the validation."}
          </p>
          {!nextStepAcceptedAt ? (
            <Button type="button" onClick={acceptNextStep}>
              <Check className="h-4 w-4" /> Accept next step
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-confirmed-600">
              <Check className="h-4 w-4" /> Decision recorded
            </span>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold">Other reasonable next steps</h2>
        <p className="mt-0.5 text-xs text-ink-subtle">Not ranked. Each makes sense under different priorities.</p>
        <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {step.alternatives.map((a) => {
            const t = nextStepTypeLabel[a.type];
            const AltIcon = t.icon;
            return (
              <li key={a.title} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium", t.className)}>
                  <AltIcon className="h-3 w-3" /> {t.label}
                </span>
                <p className="mt-2 text-[14px] font-semibold leading-snug">{a.title}</p>
                <p className="mt-1 text-[13px] text-ink-muted">{a.why}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</h3>
      <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{children}</p>
    </div>
  );
}
