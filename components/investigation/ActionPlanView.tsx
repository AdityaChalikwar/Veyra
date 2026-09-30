"use client";

import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { routes } from "@/lib/routes";
import { ActionItem } from "./ActionItem";
import { useWorkspace } from "./workspace-context";

export function ActionPlanView() {
  const { workspace, setActionStatus } = useWorkspace();
  const actions = [...workspace.actions].sort((a, b) => a.week - b.week);
  const done = actions.filter((a) => a.status === "done").length;
  const primary = workspace.recommendations.find((r) => r.isPrimary);

  return (
    <div className="mt-6 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">30-Day Action Plan</h2>
          {primary && (
            <p className="mt-1 text-[13px] text-ink-subtle">
              Turns the{" "}
              <Link href={routes.investigation(workspace.investigation.id, "recommendations")} className="font-medium text-brand-600 hover:text-brand-700">
                recommended direction
              </Link>{" "}
              into steps, each with an owner and a way to measure it.
            </p>
          )}
        </div>
        <div className="w-44">
          <p className="mb-1.5 text-right text-xs text-ink-subtle">
            {done} of {actions.length} done
          </p>
          <ProgressBar value={(done / actions.length) * 100} label="Action plan progress" />
        </div>
      </div>

      <ol className="mt-6 space-y-4">
        {actions.map((a) => (
          <li key={a.id} className="grid gap-2 sm:grid-cols-[76px_minmax(0,1fr)]">
            <p className="pt-1 text-xs font-semibold uppercase tracking-wider text-brand-700 sm:pt-5">Week {a.week}</p>
            <ActionItem action={a} onStatusChange={(s) => setActionStatus(a.id, s)} />
          </li>
        ))}
      </ol>
    </div>
  );
}
