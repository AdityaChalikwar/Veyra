import { Filter, Files, Repeat, TrendingDown, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Kpi } from "@/lib/types";

const icons = { users: Users, funnel: Filter, retention: Repeat, evidence: Files };

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = icons[kpi.icon];
  const decline = kpi.kind === "decline";
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          decline ? "bg-danger-50 text-danger-600" : kpi.kind === "stable" ? "bg-confirmed-50 text-confirmed-600" : "bg-brand-50 text-brand-600",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-subtle">{kpi.label}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xl font-semibold tracking-tight text-ink">
          <span className="truncate">{kpi.value}</span>
          {decline && <TrendingDown className="h-4 w-4 shrink-0 text-danger-600" aria-label="Decline" />}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-subtle">{kpi.detail}</p>
      </div>
    </div>
  );
}
