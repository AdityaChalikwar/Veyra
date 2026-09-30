"use client";

import Link from "next/link";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { routes } from "@/lib/routes";
import { useWorkspace } from "./workspace-context";

/** Overview row: key findings, top hypotheses and the current diagnosis at a glance. */
export function OverviewInsights() {
  const { workspace, openDetail } = useWorkspace();
  const id = workspace.investigation.id;
  const d = workspace.diagnosis;

  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      <Card title="Key Findings" href={routes.investigation(id, "findings")} count={workspace.findings.length}>
        <ol className="space-y-1">
          {workspace.findings.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => openDetail({ type: "finding", id: f.id })}
                className="flex w-full gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-canvas"
              >
                <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">
                  {i + 1}
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block text-[13px] leading-snug text-ink">{f.statement}</span>
                  <ConfidenceBadge level={f.confidence} />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Top Hypotheses" href={routes.investigation(id, "hypotheses")} count={workspace.hypotheses.length}>
        <ol className="space-y-1">
          {workspace.hypotheses.map((h, i) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => openDetail({ type: "hypothesis", id: h.id })}
                className="flex w-full gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-canvas"
              >
                <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border border-dashed border-uncertain-600/50 text-[11px] font-semibold text-uncertain-600">
                  {i + 1}
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block text-[13px] leading-snug text-ink">{h.statement}</span>
                  <ConfidenceBadge level={h.confidence} />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Current Diagnosis" href={routes.investigation(id, "diagnosis")} linkLabel="View diagnosis" className="lg:col-span-2 2xl:col-span-1">
        <div className="space-y-4 px-2 py-1">
          <div>
            <KindBadge kind="hypothesis" />
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{d.suspected[0]?.text}</p>
          </div>
          <div>
            <KindBadge kind="unknown" />
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{d.unknown[0]?.text}</p>
          </div>
          <div className="rounded-lg bg-canvas px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Biggest evidence gap</p>
            <p className="mt-0.5 text-[13px] text-ink">{d.evidenceGaps[0]?.text}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  href,
  count,
  linkLabel,
  className,
  children,
}: {
  title: string;
  href: string;
  count?: number;
  linkLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-3 shadow-card sm:p-4 ${className ?? ""}`}>
      <div className="mb-1 flex items-center justify-between px-2">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <Link href={href} className="text-xs font-medium text-brand-600 hover:text-brand-700">
          {linkLabel ?? `View all (${count})`}
        </Link>
      </div>
      {children}
    </section>
  );
}
