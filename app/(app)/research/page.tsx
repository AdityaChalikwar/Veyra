import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { ResearchLibrary } from "@/components/org/ResearchLibrary";
import { listAllEvidence } from "@/lib/data";

export const metadata = { title: "Research" };

export default async function ResearchPage() {
  const research = (await listAllEvidence()).filter((e) =>
    ["customer-evidence", "uploaded-research", "public-research"].includes(e.category),
  );
  return (
    <PageContainer>
      <PageHeader
        title="Research"
        description="Customer research, uploaded reports and public research across investigations. Veyra treats research as evidence — kept separate from company data and labelled by quality."
      />
      <ResearchLibrary initial={research} />
    </PageContainer>
  );
}
