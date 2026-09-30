import { notFound } from "next/navigation";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { InvestigationHeader } from "@/components/investigation/InvestigationHeader";
import { ShareButton } from "@/components/investigation/ShareButton";
import { SuggestionsBanner } from "@/components/investigation/SuggestionsBanner";
import { SidePanelToggles, WorkspaceFrame } from "@/components/investigation/WorkspaceFrame";
import { WorkspaceTabs } from "@/components/investigation/WorkspaceTabs";
import { getInvestigationSummary, getInvestigationWorkspace } from "@/lib/data";

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
  const [summary, workspace] = await Promise.all([getInvestigationSummary(id), getInvestigationWorkspace(id)]);
  if (!summary) notFound();

  // The preview only has full workspace data for the DAU demo.
  if (!workspace) {
    return (
      <PagePlaceholder
        title={`${summary.title} Investigation`}
        description={summary.problem}
        milestone={6}
        note="Only the DAU Decline investigation has a full workspace in this preview."
        next={{ href: "/investigations/dau-decline", label: "Open DAU Decline" }}
      />
    );
  }

  return (
    <WorkspaceFrame workspace={workspace}>
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
