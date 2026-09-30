import {
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
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { cn } from "@/lib/cn";
import { listDataSources } from "@/lib/data";
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
  { id: "company-systems", title: "Company systems", description: "Your own data — the strongest evidence Veyra can use." },
  { id: "customer-evidence", title: "Customer evidence", description: "What customers say and do. Explains why the numbers move." },
  { id: "external", title: "External research", description: "Useful context. Always labelled, and never treated as proof about your business." },
];

export default async function DataSourcesPage() {
  const sources = await listDataSources();
  const connected = sources.filter((s) => s.status === "connected").length;

  return (
    <PageContainer>
      <PageHeader
        title="Data Sources"
        description="Veyra is an investigation layer over your company's systems. It reasons across them — you don't paste data into a chat."
        actions={
          <span className="rounded-full bg-confirmed-50 px-2.5 py-1 text-xs font-medium text-confirmed-600">
            {connected} of {sources.length} connected
          </span>
        }
      />
      <p className="mt-3 text-xs text-ink-faint">Preview: connections are simulated with realistic sample data. Real integrations arrive with the backend.</p>

      {groups.map((g) => (
        <section key={g.id} className="mt-8">
          <h2 className="text-[15px] font-semibold">{g.title}</h2>
          <p className="mb-3 text-xs text-ink-subtle">{g.description}</p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sources
              .filter((s) => s.group === g.id)
              .map((s) => {
                const Icon = icons[s.id] ?? BarChart3;
                const connected = s.status === "connected";
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "flex flex-col rounded-xl border p-4",
                      connected ? "border-line bg-surface shadow-card" : "border-dashed border-line-strong bg-canvas/50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", connected ? "bg-brand-50 text-brand-600" : "bg-surface text-ink-faint")}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14.5px] font-semibold">{s.name}</h3>
                        <p className="text-xs text-ink-subtle">{s.description}</p>
                      </div>
                    </div>
                    {connected && s.metrics && (
                      <dl className="mt-3 grid grid-cols-2 gap-2">
                        {s.metrics.map((m) => (
                          <div key={m.label} className="rounded-lg bg-canvas px-2.5 py-1.5">
                            <dt className="text-[11px] text-ink-subtle">{m.label}</dt>
                            <dd className="text-[14px] font-semibold tabular-nums">{m.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <p className="mt-auto flex items-center gap-1.5 border-t border-line pt-2.5 text-xs text-ink-subtle [margin-top:0.75rem]">
                      {connected ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-confirmed-600" /> Connected · last synced {formatRelative(s.lastSyncedAt!).toLowerCase()}
                        </>
                      ) : (
                        "Not connected — available when integrations launch"
                      )}
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
