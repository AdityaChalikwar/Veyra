import { ArrowRight, BookOpen, Building2, Database, Plus } from "lucide-react";
import Link from "next/link";
import { ConnectedData } from "@/components/dashboard/ConnectedData";
import { DecisionList } from "@/components/dashboard/DecisionList";
import { InvestigationCard } from "@/components/dashboard/InvestigationCard";
import { MemoryPreview } from "@/components/dashboard/MemoryPreview";
import { OpenQuestions } from "@/components/dashboard/OpenQuestions";
import { RecentEvidence } from "@/components/dashboard/RecentEvidence";
import { ButtonLink } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import {
  listActiveInvestigations,
  listDataSources,
  listMemoryHighlights,
  listOpenQuestions,
  listRecentDecisions,
  listRecentEvidence,
} from "@/lib/data";
import { listExampleProblems } from "@/lib/data/investigations";
import { routes } from "@/lib/routes";

export const metadata = { title: "Product Discovery" };

export default async function DashboardPage() {
  const [active, sources, questions, evidence, decisions, memory] = await Promise.all([
    listActiveInvestigations(3),
    listDataSources(),
    listOpenQuestions(),
    listRecentEvidence(4),
    listRecentDecisions(3),
    listMemoryHighlights(3),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Product Discovery</h1>
          <p className="mt-1 text-ink-muted">Understand the problem before deciding what to build.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={routes.newInvestigation}>
            <Plus className="h-4 w-4" /> New Investigation
          </ButtonLink>
          <ButtonLink href={routes.dataSources} variant="secondary">
            <Database className="h-4 w-4" /> Connect Data
          </ButtonLink>
          <ButtonLink href={routes.research} variant="secondary">
            <BookOpen className="h-4 w-4" /> Add Research
          </ButtonLink>
          <ButtonLink href={routes.context} variant="secondary">
            <Building2 className="h-4 w-4" /> View Business Context
          </ButtonLink>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ConnectedData sources={sources} />
        <section className="rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5" aria-labelledby="start-heading">
          <h2 id="start-heading" className="text-[15px] font-semibold">
            Start from a problem
          </h2>
          <p className="text-xs text-ink-subtle">Bring a business or product problem — Veyra works out how to investigate it.</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {listExampleProblems().slice(0, 4).map((p) => (
              <li key={p}>
                <Link
                  href={`${routes.newInvestigation}?problem=${encodeURIComponent(p)}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas/60 px-2.5 py-1.5 text-[13px] text-ink-muted hover:border-brand-300 hover:text-brand-700"
                >
                  {p} <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10" aria-labelledby="active-heading">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="active-heading" className="text-lg font-semibold">
            Active Investigations
          </h2>
          <Link href={routes.investigations} className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
            All investigations
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((inv) => (
            <InvestigationCard key={inv.id} investigation={inv} />
          ))}
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Open Questions" action={{ href: routes.investigations, label: "Investigations" }}>
          <OpenQuestions items={questions.slice(0, 4)} />
        </Panel>
        <Panel title="Latest Evidence" action={{ href: routes.dataSources, label: "Data sources" }}>
          <RecentEvidence items={evidence} />
        </Panel>
        <Panel title="Recent Decisions" action={{ href: routes.decisions, label: "Decision log" }}>
          <DecisionList decisions={decisions} />
        </Panel>
        <Panel title="Business Memory" action={{ href: routes.memory, label: "Open" }}>
          <MemoryPreview entries={memory} />
        </Panel>
      </div>
    </div>
  );
}
