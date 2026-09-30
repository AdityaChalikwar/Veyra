import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { SettingsView } from "@/components/org/SettingsView";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader title="Settings" description="Your profile, workspace and preview data." />
      <SettingsView />
    </PageContainer>
  );
}
