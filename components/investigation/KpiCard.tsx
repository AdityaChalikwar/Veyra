"use client";

import { BarChart3, Filter, Files, Minus, Repeat, TrendingDown, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Kpi } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

const icons = { users: Users, funnel: Filter, retention: Repeat, evidence: Files, metric: BarChart3 };
const arrows = { up: TrendingUp, down: TrendingDown, flat: Minus };

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const { openDetail } = useWorkspace();
  const Icon = icons[kpi.icon];
  const decline = kpi.kind === "decline";
  // An arrow shows which way the figure moved; its colour says whether that's bad (red) or good (green) for the business.
  const Arrow = kpi.direction ? arrows[kpi.direction] : null;
  const tone = decline ? "text-danger-600" : kpi.kind === "stable" ? "text-confirmed-600" : "text-ink-subtle";
  const body = (
    <>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          decline ? "bg-danger-50 text-danger-600" : kpi.kind === "stable" ? "bg-confirmed-50 text-confirmed-600" : "bg-brand-50 text-brand-600",
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-ink-subtle">{kpi.label}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xl font-semibold tracking-tight text-ink">
          <span className="truncate">{kpi.value}</span>
          {Arrow ? (
            <Arrow className={cn("h-4 w-4 shrink-0", tone)} aria-label={`${kpi.direction}${decline ? ", worse" : kpi.kind === "stable" ? ", better" : ""}`} />
          ) : (
            decline && <TrendingDown className="h-4 w-4 shrink-0 text-danger-600" aria-label="Decline" />
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-subtle">{kpi.detail}</p>
      </div>
    </>
  );
  const box = "flex w-full gap-3 rounded-xl border border-line bg-surface p-4 text-left shadow-card";
  return kpi.findingId ? (
    <button type="button" onClick={() => openDetail({ type: "finding", id: kpi.findingId! })} className={cn(box, "transition-shadow hover:shadow-raised")}>
      {body}
    </button>
  ) : (
    <div className={box}>{body}</div>
  );
}
