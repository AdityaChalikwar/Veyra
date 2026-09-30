"use client";

import { Gauge, Target, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ActionItem as Action, ActionStatus } from "@/lib/types";

const statusStyle: Record<ActionStatus, { label: string; className: string }> = {
  "not-started": { label: "Not started", className: "bg-slate-100 text-slate-700" },
  "in-progress": { label: "In progress", className: "bg-brand-50 text-brand-700" },
  done: { label: "Done", className: "bg-confirmed-50 text-confirmed-600" },
  blocked: { label: "Blocked", className: "bg-danger-50 text-danger-600" },
};

export function ActionItem({ action, onStatusChange }: { action: Action; onStatusChange: (status: ActionStatus) => void }) {
  const selectId = `status-${action.id}`;
  return (
    <article className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold">{action.title}</h3>
          {action.detail && <p className="mt-1 text-[13px] text-ink-muted">{action.detail}</p>}
        </div>
        <label htmlFor={selectId} className="sr-only">
          Status
        </label>
        <select
          id={selectId}
          value={action.status}
          onChange={(e) => onStatusChange(e.target.value as ActionStatus)}
          className={cn("h-7 shrink-0 cursor-pointer rounded-full border-0 px-2.5 text-xs font-medium outline-none", statusStyle[action.status].className)}
        >
          {(Object.keys(statusStyle) as ActionStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusStyle[s].label}
            </option>
          ))}
        </select>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
        <Field icon={UserRound} label="Owner" value={action.owner} />
        <Field icon={Target} label="Expected outcome" value={action.expectedOutcome} />
        <Field icon={Gauge} label="Measurement" value={action.measurement} />
      </dl>
    </article>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
      <div>
        <dt className="text-[11px] text-ink-subtle">{label}</dt>
        <dd className="text-[13px] leading-snug text-ink">{value}</dd>
      </div>
    </div>
  );
}
