import { Building2, Flag, Gauge, Target, Users } from "lucide-react";
import { CompanyProfileCard } from "@/components/org/CompanyProfileCard";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { getBusinessContext, getBusinessMemory, getCompany } from "@/lib/data";

export const metadata = { title: "Business Context" };

export default async function BusinessContextPage() {
  const [company, context, memory] = await Promise.all([getCompany(), getBusinessContext(), getBusinessMemory()]);
  const segments = memory.entries.filter((e) => e.category === "segments");

  return (
    <PageContainer>
      <PageHeader
        title="Business Context"
        description="What Veyra knows about your business before any investigation starts. Every investigation reuses it, so you don't explain your business from scratch each time."
      />
      <div className="mt-8 space-y-6">
        <CompanyProfileCard fallback={company} />

        <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Building2 className="h-4 w-4 text-brand-600" /> Product & model
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Company" value={context.company} />
            <Field label="Product" value={context.product} />
            <Field label="Business model" value={context.businessModel} />
          </dl>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ListCard icon={Users} title="Target customers" items={[context.targetCustomers]} />
          <ListCard icon={Target} title="Primary business goals" items={context.goals} />
          <ListCard icon={Flag} title="Current strategic priorities" items={context.priorities} />
          <ListCard icon={Gauge} title="Key metrics" items={context.keyMetrics} />
        </div>

        <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-semibold">Customer segments</h2>
          <p className="text-xs text-ink-subtle">Learned from past investigations and kept in Business Memory.</p>
          <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {segments.map((s) => (
              <li key={s.id} className="rounded-lg bg-canvas px-3.5 py-3">
                <p className="text-[14px] font-medium">{s.title}</p>
                <p className="mt-0.5 text-[13px] text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-xs text-ink-faint">Preview: editing business context arrives with the backend. Company basics can be updated through onboarding.</p>
      </div>
    </PageContainer>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

function ListCard({ icon: Icon, title, items }: { icon: typeof Users; title: string; items: string[] }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
        <Icon className="h-4 w-4 text-brand-600" /> {title}
      </h2>
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => (
          <li key={i} className="text-[14px] text-ink">
            {i}
          </li>
        ))}
      </ul>
    </section>
  );
}
