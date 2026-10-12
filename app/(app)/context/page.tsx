import { BusinessContextEditor } from "@/components/org/BusinessContextEditor";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { getBusinessContext } from "@/lib/data";
import { listConnectedSources } from "@/lib/data/sources";

export const metadata = { title: "Business Context" };

export default async function BusinessContextPage() {
  const [context, sources] = await Promise.all([getBusinessContext(), listConnectedSources()]);
  const demo = sources.some((s) => s.connector === "demo-erp");

  return (
    <PageContainer>
      <PageHeader
        title="Business Context"
        description="What Veyra knows about your business before any investigation starts. Every investigation reuses it, so you don't explain your business from scratch each time."
      />
      <div className="mt-8 space-y-6">
        {demo && (
          <p className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 text-[13px] text-ink-muted">
            You&rsquo;re using the demo data, so this is Northwind Home&rsquo;s business context. Your own is kept and comes back
            when you disconnect the Demo ERP on Data Sources.
          </p>
        )}
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
