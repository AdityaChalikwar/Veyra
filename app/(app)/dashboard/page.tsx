import { DecisionList } from "@/components/dashboard/DecisionList";
import { Greeting } from "@/components/dashboard/Greeting";
import { InvestigationCard } from "@/components/dashboard/InvestigationCard";
import { InvestigationInput } from "@/components/dashboard/InvestigationInput";
import { MemoryPreview } from "@/components/dashboard/MemoryPreview";
import { RecentEvidence } from "@/components/dashboard/RecentEvidence";
import { Panel } from "@/components/ui/Panel";
import {
  listActiveInvestigations,
  listMemoryHighlights,
  listRecentDecisions,
  listRecentEvidence,
} from "@/lib/data";
import { routes } from "@/lib/routes";

export const metadata = { title: "Home" };

export default async function DashboardPage() {
  const [active, decisions, evidence, memory] = await Promise.all([
    listActiveInvestigations(3),
    listRecentDecisions(3),
    listRecentEvidence(4),
    listMemoryHighlights(3),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <Greeting />
      <p className="mt-1 text-ink-muted">What are you trying to solve?</p>

      <div className="mt-6">
        <InvestigationInput />
      </div>

      <section className="mt-10" aria-labelledby="active-heading">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="active-heading" className="text-lg font-semibold">
            Active Investigations
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((inv) => (
            <InvestigationCard key={inv.id} investigation={inv} />
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <Panel title="Recent Decisions" action={{ href: routes.decisions, label: "Decision Log" }}>
          <DecisionList decisions={decisions} />
        </Panel>
        <Panel title="Recent Evidence" action={{ href: routes.dataSources, label: "All sources" }}>
          <RecentEvidence items={evidence} />
        </Panel>
        <Panel title="Business Memory" action={{ href: routes.memory, label: "Open" }}>
          <MemoryPreview entries={memory} />
        </Panel>
      </div>
    </div>
  );
}
