import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe2,
  Headphones,
  Landmark,
  MessageSquare,
  Mic,
  Swords,
  TrendingUp,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ConnectDemoErpButton } from "@/components/data-sources/ConnectDemoErpButton";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { listDataSources } from "@/lib/data";
import { listConnectedSources } from "@/lib/data/sources";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import type { DataSourceGroup } from "@/lib/types";

export const metadata = { title: "Data Sources" };

const icons: Record<string, LucideIcon> = {
  "ds-analytics": BarChart3,
  "ds-erp": Boxes,
  "ds-crm": Users,
  "ds-sales": TrendingUp,
  "ds-docs": FileText,
  "ds-finance": Landmark,
  "ds-support": Headphones,
  "ds-feedback": MessageSquare,
  "ds-surveys": ClipboardList,
  "ds-research": Mic,
  "ds-market": BookOpen,
  "ds-competitors": Swords,
  "ds-web": Globe2,
};

const groups: { id: DataSourceGroup; title: string; description: string }[] = [
  { id: "company-systems", title: "More company systems", description: "Your own data — the strongest evidence Veyra can use." },
  { id: "customer-evidence", title: "Customer evidence", description: "What customers say and do. Explains why the numbers move." },
  { id: "external", title: "External research", description: "Useful context. Always labelled, and never treated as proof about your business." },
];

export default async function DataSourcesPage() {
  const [sources, connectedSources] = await Promise.all([listDataSources(), listConnectedSources()]);
  const demo = connectedSources.find((c) => c.connector === "demo-erp");

  return (
    <PageContainer>
      <PageHeader
        title="Data Sources"
        description="Veyra is an investigation layer over your company's systems. Connect a source, choose its datasets, confirm how their fields map, and sync — every investigation can then use it as evidence."
      />

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Connected</h2>
        <p className="mb-3 text-xs text-ink-subtle">Data Veyra can use as evidence in your investigations.</p>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {connectedSources.map((c) => {
            const synced = c.datasets.filter((d) => d.latest);
            return (
              <li key={c.id}>
                <Link
                  href={routes.dataSource(c.id)}
                  className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 shadow-card transition-shadow hover:shadow-raised"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <Boxes className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14.5px] font-semibold">{c.name}</h3>
                      <p className="text-xs text-ink-subtle">
                        {synced.length ? `${synced.length} of ${c.datasets.length} datasets synced` : "Set-up not finished — choose datasets and sync"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink-faint" />
                  </div>
                  {synced.length > 0 && (
                    <dl className="mt-3 grid grid-cols-3 gap-2">
                      {synced.slice(0, 6).map((d) => (
                        <div key={d.id} className="rounded-lg bg-canvas px-2.5 py-1.5">
                          <dt className="truncate text-[11px] text-ink-subtle">{d.name}</dt>
                          <dd className="text-[14px] font-semibold tabular-nums">{d.latest!.rowCount.toLocaleString("en")}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5 text-xs text-ink-subtle">
                    <CheckCircle2 className="h-3.5 w-3.5 text-confirmed-600" />
                    {c.lastSyncedAt ? `Last synced ${formatRelative(c.lastSyncedAt).toLowerCase()}` : "Connected, not synced yet"}
                  </p>
                </Link>
              </li>
            );
          })}
          <li className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <Upload className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14.5px] font-semibold">Uploaded files</h3>
                <p className="text-xs text-ink-subtle">CSV exports from any system, uploaded on an investigation&rsquo;s Evidence tab. Always available.</p>
              </div>
            </div>
          </li>
        </ul>
        {!demo && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border-2 border-brand-200 bg-brand-50/40 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[15px] font-semibold">Try the Demo ERP</p>
              <p className="mt-0.5 max-w-2xl text-[13px] text-ink-muted">
                A year of data from Northwind Home, a fictional online home-goods retailer: customers, products, orders, stock, purchasing,
                returns and invoices. Set it up exactly as you would a real ERP.
              </p>
            </div>
            <ConnectDemoErpButton />
          </div>
        )}
      </section>

      {groups.map((g) => (
        <section key={g.id} className="mt-8">
          <h2 className="text-[15px] font-semibold">{g.title}</h2>
          <p className="mb-3 text-xs text-ink-subtle">{g.description}</p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sources
              .filter((s) => s.group === g.id && s.status !== "connected")
              .map((s) => {
                const Icon = icons[s.id] ?? BarChart3;
                return (
                  <li key={s.id} className="flex flex-col rounded-xl border border-dashed border-line-strong bg-canvas/50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-ink-faint">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14.5px] font-semibold">{s.name}</h3>
                        <p className="text-xs text-ink-subtle">{s.description}</p>
                      </div>
                    </div>
                    <p className="mt-auto border-t border-line pt-2.5 text-xs text-ink-subtle [margin-top:0.75rem]">
                      {s.id === "ds-erp" ? "Real ERP connectors (SAP, Oracle, Dynamics…) come later — use the Demo ERP now." : "Connector coming later — upload a CSV export meanwhile."}
                    </p>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </PageContainer>
  );
}
