import { AppShell } from "@/components/layout/AppShell";
import { listInvestigations } from "@/lib/data";

// Mock timestamps are relative to "now", so render per request rather than at build time.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const investigations = await listInvestigations();
  return <AppShell investigations={investigations}>{children}</AppShell>;
}
