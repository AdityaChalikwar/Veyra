import { MemoryBrowser } from "@/components/org/MemoryBrowser";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { getBusinessMemory } from "@/lib/data";

export const metadata = { title: "Business Memory" };

export default async function BusinessMemoryPage() {
  const memory = await getBusinessMemory();
  return (
    <PageContainer>
      <PageHeader
        title="Business Memory"
        description="What Veyra has learned about your business across investigations. It's used as context in every new investigation."
      />
      <MemoryBrowser memory={memory} />
    </PageContainer>
  );
}
