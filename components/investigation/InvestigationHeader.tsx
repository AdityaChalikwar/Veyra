"use client";

import { CalendarDays, Clock, Files } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatRelative } from "@/lib/time";
import { DiscoveryStages } from "./DiscoveryStages";
import { NextActionBar } from "./NextActionBar";
import { useWorkspace } from "./workspace-context";

export function InvestigationHeader({ actions }: { actions?: React.ReactNode }) {
  const { workspace } = useWorkspace();
  const inv = workspace.investigation;
  return (
    <header className="pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Investigation</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">{inv.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>

      <div className="mt-3 rounded-xl border border-line bg-surface p-4 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Problem</p>
        <p className="mt-0.5 text-[15px] font-medium text-ink">&ldquo;{inv.problem}&rdquo;</p>
        <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-subtle">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Status</dt>
            <dd>
              <StatusBadge status={inv.status} />
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt>Confidence</dt>
            <dd>
              <ConfidenceBadge level={inv.confidence} bare />
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="flex items-center gap-1">
              <Files className="h-3.5 w-3.5" /> Evidence
            </dt>
            <dd className="font-medium text-ink">{inv.evidenceCount} sources</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> Created {formatDate(inv.createdAt)}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Updated {formatRelative(inv.updatedAt).toLowerCase()}
          </div>
        </dl>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Investigation progress</p>
        <DiscoveryStages stages={workspace.stages} />
        <NextActionBar />
      </div>
    </header>
  );
}
