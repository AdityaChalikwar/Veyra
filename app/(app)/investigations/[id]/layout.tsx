import { notFound } from "next/navigation";
import { EditInvestigationButton } from "@/components/investigation/EditInvestigationButton";
import { InvestigationHeader } from "@/components/investigation/InvestigationHeader";
import { SampleBanner } from "@/components/investigation/SampleBanner";
import { ShareButton } from "@/components/investigation/ShareButton";
import { SuggestionsBanner } from "@/components/investigation/SuggestionsBanner";
import { SidePanelToggles, WorkspaceFrame } from "@/components/investigation/WorkspaceFrame";
import { WorkspaceTabs } from "@/components/investigation/WorkspaceTabs";
import { getInvestigationSummary, getInvestigationWorkspace } from "@/lib/data";

/** Analysis runs as a server action from this page; a long Claude answer needs more than the default time. */
export const maxDuration = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = await getInvestigationSummary(id);
  return { title: summary ? `${summary.title} Investigation` : "Investigation" };
}

export default async function InvestigationLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const summary = await getInvestigationSummary(id);
  if (!summary) notFound();

  const workspace = await getInvestigationWorkspace(id);
  if (!workspace) notFound();
  const live = workspace.live;

  return (
    <WorkspaceFrame workspace={workspace}>
      {live ? null : <SampleBanner investigationId={id} />}
      <InvestigationHeader
        actions={
          <>
            <SidePanelToggles />
            {live ? (
              <EditInvestigationButton
                investigationId={id}
                initial={{
                  title: summary.title,
                  problem: summary.problem,
                  objective: live.record.objective,
                  trigger: live.record.trigger,
                  outcome: live.record.outcome,
                }}
              />
            ) : (
              <ShareButton />
            )}
          </>
        }
      />
      <div className="mt-6">
        <WorkspaceTabs investigationId={id} />
      </div>
      <SuggestionsBanner />
      {children}
    </WorkspaceFrame>
  );
}
