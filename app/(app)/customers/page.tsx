import Link from "next/link";
import { EvidenceFormatIcon } from "@/components/evidence/EvidenceFormatIcon";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { getBusinessContext, getBusinessMemory, listAllEvidence } from "@/lib/data";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import { EmptyNote } from "@/components/ui/EmptyNote";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const [context, memory, evidence] = await Promise.all([getBusinessContext(), getBusinessMemory(), listAllEvidence()]);
  const segments = memory.entries.filter((e) => e.category === "segments");
  const customerEvidence = evidence.filter((e) => e.category === "customer-evidence");
  const validated = memory.entries.filter((e) => e.category === "validated-problems");

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="What Veyra knows about your customers: who they are, what they say, and which of their problems have been validated."
      />
      <section className="mt-8 rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Target customers</h2>
        {context.targetCustomers ? (
          <p className="mt-1 text-[15px] font-medium">{context.targetCustomers}</p>
        ) : (
          <p className="mt-1 text-[13px] text-ink-faint">
            Not set yet —{" "}
            <Link href={routes.context} className="font-medium text-brand-600 hover:text-brand-700">
              add it in Business Context
            </Link>
            .
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[15px] font-semibold">Segments</h2>
        {segments.length === 0 && <EmptyNote>Customer segments are learned from completed investigations and kept in Business Memory.</EmptyNote>}
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {segments.map((s) => (
            <li key={s.id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <p className="text-[14px] font-semibold">{s.title}</p>
              <p className="mt-0.5 text-[13px] text-ink-muted">{s.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[15px] font-semibold">Customer evidence</h2>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {customerEvidence.map((e) => (
            <li key={e.id} className="flex gap-3 rounded-xl border border-l-[3px] border-line border-l-violet-500 bg-surface p-4 shadow-card">
              <EvidenceFormatIcon format={e.format} />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold">{e.name}</p>
                <p className="text-xs text-ink-subtle">
                  {e.source} · {formatRelative(e.addedAt)} ·{" "}
                  <Link href={routes.investigation(e.investigationId, "evidence")} className="hover:text-brand-600">
                    {e.investigationTitle}
                  </Link>
                </p>
                {e.description && <p className="mt-1 text-[13px] text-ink-muted">{e.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[15px] font-semibold">Validated customer problems</h2>
        <ul className="space-y-2">
          {validated.map((v) => (
            <li key={v.id} className="rounded-xl border border-confirmed-200 bg-surface p-4 shadow-card">
              <p className="text-[14px] font-semibold">{v.title}</p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {v.body} {v.sourceInvestigationTitle && <span className="text-ink-subtle">— {v.sourceInvestigationTitle}</span>}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}
