import Link from "next/link";
import { decisionStatus } from "@/components/org/decision-status";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { cn } from "@/lib/cn";
import { listDecisions } from "@/lib/data";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/time";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { DecisionResultForm } from "@/components/org/DecisionResultForm";
import { OUTCOME_LABEL } from "@/lib/brief/build";

export const metadata = { title: "Decision Log" };

export default async function DecisionLogPage() {
  const decisions = await listDecisions();
  return (
    <PageContainer>
      <PageHeader title="Decision Log" description="Every decision, why it was made, and what happened next." />
      {decisions.length === 0 && <EmptyNote className="mt-8">No decisions yet. When your team records a decision from an investigation&rsquo;s Decision Brief, it&rsquo;s logged here with the reasoning.</EmptyNote>}
      <ul className="mt-8 space-y-3">
        {decisions.map((d) => (
          <li key={d.id} className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold leading-snug">{d.decision}</h2>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium", decisionStatus[d.status].className)}>
                {decisionStatus[d.status].label}
              </span>
            </div>
            {d.kind && <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">{OUTCOME_LABEL[d.kind]}</p>}
            <p className="mt-1 text-xs text-ink-subtle">
              <Link href={routes.investigation(d.investigationId)} className="hover:text-brand-600">
                {d.investigationTitle}
              </Link>{" "}
              · {d.owner} · {formatDate(d.decidedAt)}
              {d.reviewDate && ` · Review ${formatDate(d.reviewDate)}`}
            </p>
            {d.warnings && d.warnings.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-lg bg-uncertain-50 px-3 py-2 text-[12.5px] text-uncertain-600">
                {d.warnings.map((w) => (
                  <li key={w}>Decided despite: {w}</li>
                ))}
              </ul>
            )}
            {(d.rationale || d.outcome) && (
              <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2">
                {d.rationale && (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Why</dt>
                    <dd className="mt-0.5 text-[13px] text-ink">{d.rationale}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Outcome</dt>
                  <dd className={cn("mt-0.5 text-[13px]", d.outcome ? "text-ink" : "text-ink-faint")}>{d.outcome ?? "Not measured yet"}</dd>
                  {d.kind && !d.outcome && <DecisionResultForm decisionId={d.id} />}
                </div>
              </dl>
            )}
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
