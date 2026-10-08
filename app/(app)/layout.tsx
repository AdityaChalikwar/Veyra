import { AppShell } from "@/components/layout/AppShell";
import { requireWorkspace } from "@/lib/auth";
import { listInvestigations } from "@/lib/data";

// Signed-in pages depend on the session and (for now) on mock data with relative timestamps.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, company } = await requireWorkspace();
  const investigations = await listInvestigations();
  return (
    <AppShell investigations={investigations} session={{ user: session.user, company, method: session.method }}>
      {children}
    </AppShell>
  );
}
