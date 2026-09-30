import { notFound } from "next/navigation";
import { TabPlaceholder } from "@/components/investigation/TabPlaceholder";
import { WORKSPACE_TABS } from "@/components/investigation/tabs";

/** Which milestone builds each tab that isn't built yet. */
const upcoming: Record<string, number> = {
  evidence: 7,
  findings: 7,
  hypotheses: 7,
  diagnosis: 7,
  recommendations: 8,
  "action-plan": 8,
  notes: 8,
};

export default async function WorkspaceTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  const config = WORKSPACE_TABS.find((t) => t.slug === tab);
  if (!config || !upcoming[tab]) notFound();
  return <TabPlaceholder label={config.label} milestone={upcoming[tab]} />;
}
