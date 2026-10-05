import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EvidenceStrengthBadge } from "@/components/ui/EvidenceStrengthBadge";
import { listOpportunities } from "@/lib/data";
import { routes } from "@/lib/routes";
import { EmptyNote } from "@/components/ui/EmptyNote";

export const metadata = { title: "Opportunities" };

const levelLabel = { low: "Low", medium: "Medium", high: "High" } as const;

export default async function OpportunitiesPage() {
  const opportunities = await listOpportunities();
  return (
    <PageContainer>
      <PageHeader
        title="Opportunities"
        description="Areas worth solving for, found through investigations. Opportunities are not features — solutions are explored once the problem is understood."
      />
      {opportunities.length === 0 && <EmptyNote className="mt-8">No opportunities yet. They appear once an investigation&rsquo;s data has been analysed.</EmptyNote>}
      <ul className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        {opportunities.map((o) => (
          <li key={`${o.investigationId}-${o.title}`} className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <Link href={routes.investigation(o.investigationId, "opportunities")} className="text-xs text-ink-subtle hover:text-brand-600">
              {o.investigationTitle}
            </Link>
            <h2 className="mt-1 text-[15px] font-semibold">{o.title}</h2>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Evidence</dt>
                <dd>
                  <EvidenceStrengthBadge strength={o.evidenceStrength} bare />
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Potential impact</dt>
                <dd className="text-[13px] font-semibold">{levelLabel[o.impact]}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Confidence</dt>
                <dd>
                  <ConfidenceBadge level={o.confidence} bare className="-ml-1.5 bg-transparent" />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
