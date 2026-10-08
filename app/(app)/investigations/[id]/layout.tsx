import { notFound } from "next/navigation";
import { InvestigationBrief } from "@/components/investigation/InvestigationBrief";
import { InvestigationHeader } from "@/components/investigation/InvestigationHeader";
import { SampleBanner } from "@/components/investigation/SampleBanner";
import { ShareButton } from "@/components/investigation/ShareButton";
import { SuggestionsBanner } from "@/components/investigation/SuggestionsBanner";
import { SidePanelToggles, WorkspaceFrame } from "@/components/investigation/WorkspaceFrame";
import { WorkspaceTabs } from "@/components/investigation/WorkspaceTabs";
import { getInvestigationRecord, getInvestigationSummary, getInvestigationWorkspace, listDataSources } from "@/lib/data";

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

  // Until its data is analysed, an investigation is its brief: problem, answers and plan.
  if (!summary.isSample) {
    const [record, dataSources] = await Promise.all([getInvestigationRecord(id), listDataSources()]);
    if (!record) notFound();
    return <InvestigationBrief record={record} dataSources={dataSources} />;
  }

  const workspace = await getInvestigationWorkspace(id);
  if (!workspace) notFound();

  return (
    <WorkspaceFrame workspace={workspace}>
      <SampleBanner investigationId={id} />
      <InvestigationHeader
        actions={
          <>
            <SidePanelToggles />
            <ShareButton />
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
