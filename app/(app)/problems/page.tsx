import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { cn } from "@/lib/cn";
import { listProblems } from "@/lib/data";
import { routes } from "@/lib/routes";
import { EmptyNote } from "@/components/ui/EmptyNote";

export const metadata = { title: "Problems" };

const statusStyle = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  refined: { label: "Defined · provisional", className: "bg-uncertain-50 text-uncertain-600" },
  likely: { label: "Defined · likely cause", className: "bg-confirmed-50/60 text-confirmed-600" },
  validated: { label: "Defined · cause validated", className: "bg-confirmed-50 text-confirmed-600" },
} as const;

export default async function ProblemsPage() {
  const problems = await listProblems();
  return (
    <PageContainer>
      <PageHeader
        title="Problems"
        description="Problem statements across investigations, defined from the evidence. Provisional until a hypothesis about the cause is confirmed. Problems come before solutions."
      />
      {problems.length === 0 && <EmptyNote className="mt-8">No problems yet. Start an investigation to define one.</EmptyNote>}
      <ul className="mt-8 space-y-3">
        {problems.map((p) => (
          <li key={p.investigationId} className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", statusStyle[p.status].className)}>{statusStyle[p.status].label}</span>
              <ConfidenceBadge level={p.confidence} />
              <Link href={routes.investigation(p.investigationId, "problem")} className="text-xs text-ink-subtle hover:text-brand-600">
                {p.investigationTitle}
              </Link>
            </div>
            {p.original && <p className="mt-3 text-[13px] text-ink-subtle line-through decoration-ink-faint/40">&ldquo;{p.original}&rdquo;</p>}
            <p className="mt-1 text-[15px] font-semibold leading-snug">&ldquo;{p.refined}&rdquo;</p>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
