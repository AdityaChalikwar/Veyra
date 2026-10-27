import { AppShell } from "@/components/layout/AppShell";
import { getAiUsage } from "@/lib/ai/usage";
import { requireWorkspace } from "@/lib/auth";
import { listInvestigations } from "@/lib/data";
import { listConnectedSources } from "@/lib/data/sources";

// Signed-in pages depend on the session and (for now) on mock data with relative timestamps.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, company } = await requireWorkspace();
  const [investigations, connected, aiUsage] = await Promise.all([listInvestigations(), listConnectedSources(), getAiUsage()]);
  const demo = connected.find((c) => c.connector === "demo-erp");
  return (
    <AppShell
      investigations={investigations}
      session={{ user: session.user, company, method: session.method, demo: demo ? { sourceId: demo.id, name: "Northwind Home" } : undefined, aiUsage }}
    >
      {children}
    </AppShell>
  );
}
