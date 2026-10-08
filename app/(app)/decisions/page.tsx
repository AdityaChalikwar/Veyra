import Link from "next/link";
import { decisionStatus } from "@/components/org/decision-status";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { cn } from "@/lib/cn";
import { listDecisions } from "@/lib/data";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/time";
import { EmptyNote } from "@/components/ui/EmptyNote";

export const metadata = { title: "Decision Log" };

export default async function DecisionLogPage() {
  const decisions = await listDecisions();
  return (
    <PageContainer>
      <PageHeader title="Decision Log" description="Every decision, why it was made, and what happened next." />
      {decisions.length === 0 && <EmptyNote className="mt-8">No decisions yet. When your team accepts a next step or records a verdict in an investigation, it&rsquo;s logged here with the reasoning.</EmptyNote>}
      <ul className="mt-8 space-y-3">
        {decisions.map((d) => (
          <li key={d.id} className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold leading-snug">{d.decision}</h2>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium", decisionStatus[d.status].className)}>
                {decisionStatus[d.status].label}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-subtle">
              <Link href={routes.investigation(d.investigationId)} className="hover:text-brand-600">
                {d.investigationTitle}
              </Link>{" "}
              · {d.owner} · {formatDate(d.decidedAt)}
            </p>
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
                </div>
              </dl>
            )}
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
