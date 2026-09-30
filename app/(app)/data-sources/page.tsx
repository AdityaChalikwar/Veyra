import { BarChart3, CreditCard, Globe2, Megaphone, Users, type LucideIcon } from "lucide-react";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { cn } from "@/lib/cn";
import { listAllEvidence, listDataSources } from "@/lib/data";
import { formatRelative } from "@/lib/time";
import type { DataSource } from "@/lib/types";

export const metadata = { title: "Data Sources" };

const kindIcon: Record<DataSource["kind"], LucideIcon> = {
  "Product analytics": BarChart3,
  Marketing: Megaphone,
  CRM: Users,
  Payments: CreditCard,
  "Web analytics": Globe2,
  Files: BarChart3,
};

export default async function DataSourcesPage() {
  const [sources, evidence] = await Promise.all([listDataSources(), listAllEvidence()]);
  const files = evidence.filter((e) => e.category === "company-data");

  return (
    <PageContainer>
      <PageHeader title="Data Sources" description="Where Veyra gets company data. Connected sources keep investigations up to date." />

      <section className="mt-8">
        <h2 className="mb-3 text-[15px] font-semibold">Connections</h2>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((s) => {
            const Icon = kindIcon[s.kind];
            const connected = s.status === "connected";
            return (
              <li key={s.id} className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", connected ? "bg-brand-50 text-brand-600" : "bg-canvas text-ink-faint")}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14.5px] font-semibold">{s.name}</h3>
                    <p className="text-xs text-ink-subtle">{s.kind}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      connected ? "bg-confirmed-50 text-confirmed-600" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {connected ? "Connected" : "Not connected"}
                  </span>
                </div>
                <p className="mt-3 flex-1 text-[13px] text-ink-muted">{s.description}</p>
                <p className="mt-3 border-t border-line pt-2.5 text-xs text-ink-subtle">
                  {connected
                    ? `Synced ${formatRelative(s.lastSyncedAt!).toLowerCase()} · ${s.itemCount} dataset${s.itemCount === 1 ? "" : "s"}`
                    : "Connecting sources arrives with the backend."}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[15px] font-semibold">Uploaded files</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {files.map((f) => (
            <li key={f.id} className="rounded-xl border border-line bg-surface p-2 shadow-card">
              <EvidenceCard item={f} />
              <p className="border-t border-line px-2 pb-1 pt-2 text-xs text-ink-subtle">Used in {f.investigationTitle}</p>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}
