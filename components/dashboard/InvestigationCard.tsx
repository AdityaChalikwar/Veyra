import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { TopicIcon } from "@/components/investigation/TopicIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import type { InvestigationStage, InvestigationSummary } from "@/lib/types";

const stageLabel: Record<InvestigationStage, string> = {
  setup: "Setup",
  evidence: "Evidence",
  analysis: "Analysis",
  diagnosis: "Diagnosis",
  recommendation: "Recommendation",
  action: "Action",
};

export function InvestigationCard({ investigation: inv }: { investigation: InvestigationSummary }) {
  return (
    <Link
      href={routes.investigation(inv.id)}
      className="group flex flex-col rounded-xl border border-line bg-surface p-5 shadow-card transition-shadow hover:border-line-strong hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <TopicIcon topic={inv.topic} />
        </span>
        <StatusBadge status={inv.status} long />
      </div>

      <h3 className="mt-4 text-base font-semibold">{inv.title}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-[13px] leading-relaxed text-ink-muted">{inv.headline}</p>

      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-ink-subtle">
            Stage: <span className="font-medium text-ink">{stageLabel[inv.stage]}</span>
          </span>
          <span className="font-semibold tabular-nums text-ink">{inv.progress}%</span>
        </div>
        <ProgressBar value={inv.progress} label={`${inv.title} progress`} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-subtle">
        <span>Updated {formatRelative(inv.updatedAt).toLowerCase()}</span>
        <ArrowRight className="h-3.5 w-3.5 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </div>
    </Link>
  );
}
