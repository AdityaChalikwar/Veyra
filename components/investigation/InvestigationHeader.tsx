import { CalendarDays, Clock } from "lucide-react";
import { formatDate, formatRelative } from "@/lib/time";
import type { Investigation } from "@/lib/types";
import { ProgressStepper } from "./ProgressStepper";

export function InvestigationHeader({
  investigation,
  actions,
}: {
  investigation: Investigation;
  /** Buttons shown top-right (share, evidence toggle…). */
  actions?: React.ReactNode;
}) {
  return (
    <header className="pt-6">
      <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{investigation.title} Investigation</h1>
            <div className="flex shrink-0 items-center gap-2 2xl:hidden">{actions}</div>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{investigation.subtitle}</p>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-subtle">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Created {formatDate(investigation.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Last updated {formatRelative(investigation.updatedAt).toLowerCase()}
            </span>
          </p>
        </div>
        <div className="w-full shrink-0 2xl:w-[460px]">
          <div className="mb-3 hidden justify-end gap-2 2xl:flex">{actions}</div>
          <ProgressStepper current={investigation.stage} />
        </div>
      </div>
    </header>
  );
}
