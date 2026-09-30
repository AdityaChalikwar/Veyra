import { ArrowRight, CircleHelp, Files, FlaskConical } from "lucide-react";
import Link from "next/link";
import { TopicIcon } from "@/components/investigation/TopicIcon";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import type { InvestigationSummary } from "@/lib/types";

/** An ongoing discovery project — persistent work, not a conversation. */
export function InvestigationCard({ investigation: inv }: { investigation: InvestigationSummary }) {
  return (
    <Link
      href={routes.investigation(inv.id)}
      className="group flex flex-col rounded-xl border border-line bg-surface p-5 shadow-card transition-shadow hover:border-line-strong hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <TopicIcon topic={inv.topic} />
          </span>
          <h3 className="min-w-0 text-[15px] font-semibold leading-snug">{inv.title}</h3>
        </div>
        <StatusBadge status={inv.status} />
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-[13px] leading-relaxed text-ink-muted">{inv.problem}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
        <Metric icon={Files} label="Evidence" value={`${inv.evidenceCount} sources`} />
        <Metric icon={FlaskConical} label="Hypotheses" value={String(inv.hypothesisCount)} />
        <Metric icon={CircleHelp} label="Open questions" value={String(inv.openQuestionCount)} />
      </dl>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink-subtle">
        <ConfidenceBadge level={inv.confidence} />
        <span className="flex items-center gap-1.5">
          Updated {formatRelative(inv.updatedAt).toLowerCase()}
          <ArrowRight className="h-3.5 w-3.5 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
        </span>
      </div>
    </Link>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Files; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 truncate text-[11px] text-ink-faint">
        <Icon className="h-3 w-3 shrink-0" /> <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}
