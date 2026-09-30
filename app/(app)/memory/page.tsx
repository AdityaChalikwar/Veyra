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
        actions={<span className="rounded-full bg-uncertain-50 px-2.5 py-1 text-xs font-medium text-uncertain-600">Early preview</span>}
      />
      <MemoryBrowser memory={memory} />
    </PageContainer>
  );
}
