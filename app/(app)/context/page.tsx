import { BusinessContextEditor } from "@/components/org/BusinessContextEditor";
import { CompanyProfileCard } from "@/components/org/CompanyProfileCard";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { getBusinessContext } from "@/lib/data";

export const metadata = { title: "Business Context" };

export default async function BusinessContextPage() {
  const context = await getBusinessContext();

  return (
    <PageContainer>
      <PageHeader
        title="Business Context"
        description="What Veyra knows about your business before any investigation starts. Every investigation reuses it, so you don't explain your business from scratch each time."
      />
      <div className="mt-8 space-y-6">
        <CompanyProfileCard />
        <BusinessContextEditor context={context} />
        <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-semibold">Customer segments</h2>
          <p className="text-xs text-ink-subtle">Learned from past investigations and kept in Business Memory.</p>
          <p className="mt-3 text-[13px] text-ink-faint">Segments appear here as investigations are completed.</p>
        </section>
      </div>
    </PageContainer>
  );
}
