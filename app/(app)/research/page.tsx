import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { ResearchLibrary } from "@/components/org/ResearchLibrary";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { cn } from "@/lib/cn";
import { listAllEvidence, listResearchTasks } from "@/lib/data";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";

export const metadata = { title: "Research" };

const statusStyle = {
  "not-started": { label: "Not started", className: "bg-slate-100 text-slate-600" },
  "in-progress": { label: "In progress", className: "bg-brand-50 text-brand-700" },
  done: { label: "Done", className: "bg-confirmed-50 text-confirmed-600" },
  dropped: { label: "Dropped", className: "bg-slate-100 text-slate-500" },
} as const;

const method: Record<string, string> = {
  "data-analysis": "Data analysis",
  "customer-interviews": "Customer interviews",
  survey: "Survey",
  "feedback-analysis": "Feedback analysis",
  "usability-testing": "Usability testing",
  experiment: "Experiment",
  "desk-research": "Desk research",
};

export default async function ResearchPage() {
  const [tasks, evidence] = await Promise.all([listResearchTasks(), listAllEvidence()]);
  const documents = evidence.filter((e) => ["customer-evidence", "uploaded-research", "public-research"].includes(e.category));
  return (
    <PageContainer>
      <PageHeader
        title="Research"
        description="The research your investigations need: what to find out, how, and what the team found. Finished research feeds the next analysis and Business Memory."
      />
      {tasks.length === 0 && <EmptyNote className="mt-8">No research yet. Veyra suggests research tasks when it analyses an investigation&rsquo;s data.</EmptyNote>}
      <ul className="mt-8 space-y-3">
        {tasks.map((t) => (
          <li key={t.id} className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", statusStyle[t.status].className)}>{statusStyle[t.status].label}</span>
              <span className="text-xs text-ink-subtle">
                {method[t.method] ?? t.method} · {t.priority} priority ·{" "}
                <Link href={routes.investigation(t.investigationId, "research")} className="hover:text-brand-600">
                  {t.investigationTitle}
                </Link>{" "}
                · {formatRelative(t.updatedAt)}
              </span>
            </div>
            <h2 className="mt-2 text-[15px] font-semibold leading-snug">{t.title}</h2>
            <p className="mt-0.5 text-[13px] text-ink-muted">{t.question}</p>
            {t.outcome.trim() && <p className="mt-2 rounded-lg bg-confirmed-50 px-3 py-2 text-[13px] text-ink">Found: {t.outcome}</p>}
          </li>
        ))}
      </ul>
      {documents.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-[15px] font-semibold">Research documents</h2>
          <ResearchLibrary initial={documents} />
        </section>
      )}
    </PageContainer>
  );
}
