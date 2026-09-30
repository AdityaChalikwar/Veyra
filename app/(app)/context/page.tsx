import { CompanyProfileCard } from "@/components/org/CompanyProfileCard";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { getBusinessMemory, getCompany } from "@/lib/data";
import type { MemoryCategory } from "@/lib/types";

export const metadata = { title: "Business Context" };

const sections: { category: MemoryCategory; title: string }[] = [
  { category: "company", title: "Company" },
  { category: "products", title: "Products" },
  { category: "customers", title: "Customers" },
  { category: "segments", title: "Segments" },
];

export default async function BusinessContextPage() {
  const [company, memory] = await Promise.all([getCompany(), getBusinessMemory()]);
  return (
    <PageContainer>
      <PageHeader
        title="Business Context"
        description="What Veyra knows about your company before any investigation starts. Keeping it current makes every investigation more relevant."
      />
      <div className="mt-8 space-y-6">
        <CompanyProfileCard fallback={company} />
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((s) => {
            const entries = memory.entries.filter((e) => e.category === s.category);
            return (
              <section key={s.category} className="rounded-xl border border-line bg-surface p-5 shadow-card">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{s.title}</h2>
                <ul className="mt-3 space-y-3">
                  {entries.map((e) => (
                    <li key={e.id}>
                      <p className="text-[14px] font-medium text-ink">{e.title}</p>
                      <p className="text-[13px] text-ink-muted">{e.body}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
