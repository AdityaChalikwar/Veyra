import { Plus } from "lucide-react";
import { InvestigationCard } from "@/components/dashboard/InvestigationCard";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { listInvestigations } from "@/lib/data";
import { routes } from "@/lib/routes";

export const metadata = { title: "Investigations" };

export default async function InvestigationsPage() {
  const all = await listInvestigations();
  const active = all.filter((i) => i.status !== "completed");
  const completed = all.filter((i) => i.status === "completed");
  return (
    <PageContainer>
      <PageHeader
        title="Investigations"
        description="Ongoing product discovery. Each investigation keeps its evidence, findings, hypotheses and decisions together."
        actions={
          <ButtonLink href={routes.newInvestigation}>
            <Plus className="h-4 w-4" /> New Investigation
          </ButtonLink>
        }
      />
      <h2 className="mb-3 mt-8 text-[15px] font-semibold">Active</h2>
      {active.length === 0 && <EmptyNote>No investigations yet. Start one from a problem your team is facing.</EmptyNote>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {active.map((i) => (
          <InvestigationCard key={i.id} investigation={i} />
        ))}
      </div>
      {completed.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-[15px] font-semibold">Completed</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {completed.map((i) => (
              <InvestigationCard key={i.id} investigation={i} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
