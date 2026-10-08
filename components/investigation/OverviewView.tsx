"use client";

import { ArrowRight, Brain, CheckCircle2, ChevronDown, CircleHelp, CircleSlash, Compass, Database, Info, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { cn } from "@/lib/cn";
import { outcomeLabel, triggerLabel } from "@/lib/options";
import { routes } from "@/lib/routes";
import type { DataSource, LiveInvestigation } from "@/lib/types";
import { AnalysisSection } from "./AnalysisSection";
import { AnswersEditor } from "./AnswersEditor";
import { ChartCard } from "./ChartCard";
import { DataUploader } from "./DataUploader";
import { DauTrendChart } from "./DauTrendChart";
import { DeleteInvestigationButton } from "./DeleteInvestigationButton";
import { HypothesisCard } from "./HypothesisCard";
import { InvestigationMap } from "./InvestigationMap";
import { KpiCard } from "./KpiCard";
import { nextStepTypeLabel } from "./NextStepView";
import { QuestionCard } from "./QuestionCard";
import { RatesChart, RatesLegend } from "./RatesChart";
import { useWorkspace } from "./workspace-context";

/**
 * The investigation at a glance, in the order a PM needs it: what we know,
 * what we don't, what might explain it, what's needed, and what to do next.
 */
export function OverviewView() {
  const { workspace } = useWorkspace();
  const id = workspace.investigation.id;
  const tab = (slug: string) => routes.investigation(id, slug);

  if (workspace.live) return <LiveOverview live={workspace.live} tab={tab} />;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {workspace.kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <WhatWeKnow href={tab("findings")} />
        <WhatWeDontKnow href={tab("research")} />
      </div>

      <NextStepSummary href={tab("next-step")} />

      <section>
        <SectionHeader title="Active Hypotheses" href={tab("hypotheses")} linkLabel="All hypotheses" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {workspace.hypotheses.map((h) => (
            <HypothesisCard key={h.id} hypothesis={h} compact />
          ))}
        </div>
      </section>

      <RelatedMemory />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={workspace.trend.title}
          source={sourceLabel(workspace, workspace.trend.sourceEvidenceId)}
          table={{
            caption: `${workspace.trend.metric} by week`,
            columns: ["Week of", `DAU (${workspace.trend.unit})`, "Note"],
            rows: workspace.trend.points.map((p) => [p.period, p.value, p.annotation ?? ""]),
          }}
        >
          <DauTrendChart points={workspace.trend.points} unit={workspace.trend.unit} metric={workspace.trend.metric} />
        </ChartCard>
        <ChartCard
          title={workspace.rates.title}
          legend={<RatesLegend primaryLabel={workspace.rates.primaryLabel} secondaryLabel={workspace.rates.secondaryLabel} />}
          source={sourceLabel(workspace, workspace.rates.sourceEvidenceId)}
          table={{
            caption: `${workspace.rates.primaryLabel} and ${workspace.rates.secondaryLabel} by week`,
            columns: ["Week of", workspace.rates.primaryLabel, workspace.rates.secondaryLabel],
            rows: workspace.rates.points.map((p) => [p.period, `${p.primary}%`, `${p.secondary}%`]),
          }}
        >
          <RatesChart points={workspace.rates.points} primaryLabel={workspace.rates.primaryLabel} secondaryLabel={workspace.rates.secondaryLabel} />
        </ChartCard>
      </div>

      <PlanSection />
      <InvestigationMap map={workspace.map} />
      <Brief />
    </div>
  );
}

function sourceLabel(workspace: ReturnType<typeof useWorkspace>["workspace"], evidenceId?: string) {
  const e = workspace.evidence.find((x) => x.id === evidenceId);
  return e ? `${e.source} · ${e.dataset ?? e.name}` : undefined;
}

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-semibold uppercase tracking-wide">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/** Observations only — each statement shows exactly where it comes from. */
function WhatWeKnow({ href }: { href: string }) {
  const { workspace, openDetail } = useWorkspace();
  const known = workspace.findings.filter((f) => f.kind === "observation").slice(0, 5);
  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-wide">
          <CheckCircle2 className="h-4 w-4 text-confirmed-600" /> What we know
        </h2>
        <Link href={href} className="text-xs font-medium text-brand-600 hover:text-brand-700">
          All findings
        </Link>
      </div>
      <p className="mb-3 text-xs text-ink-subtle">Observations taken directly from your data.</p>
      {known.length === 0 && <p className="text-[13px] text-ink-faint">Nothing yet — Veyra fills this in once it has analysed your data.</p>}
      <ul className="divide-y divide-line">
        {known.map((f) => {
          const e = workspace.evidence.find((x) => x.id === f.evidenceIds[0]);
          return (
            <li key={f.id} className="py-3 first:pt-0">
              <p className="text-[14px] font-medium leading-snug text-ink">{f.statement}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-subtle">
                {e && (
                  <span className="flex items-center gap-1">
                    <Database className="h-3 w-3" /> {e.source} · {e.dataset ?? e.name}
                  </span>
                )}
                <ConfidenceBadge level={f.confidence} />
                <button type="button" onClick={() => openDetail({ type: "finding", id: f.id })} className="font-medium text-brand-600 hover:text-brand-700">
                  View evidence
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WhatWeDontKnow({ href }: { href: string }) {
  const { workspace, openDetail } = useWorkspace();
  return (
    <section className="rounded-xl border border-dashed border-line-strong bg-canvas/60 p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-wide">
          <CircleHelp className="h-4 w-4 text-ink-subtle" /> What we don&rsquo;t know
        </h2>
        <Link href={href} className="text-xs font-medium text-brand-600 hover:text-brand-700">
          Research needed
        </Link>
      </div>
      <p className="mb-3 text-xs text-ink-subtle">Veyra won&rsquo;t guess. These stay open until evidence answers them.</p>
      {workspace.openQuestions.length === 0 && <p className="text-[13px] text-ink-faint">No open questions right now.</p>}
      <ul className="space-y-2">
        {workspace.openQuestions.map((q) => {
          const answered = q.answeredByFindingId;
          return (
            <li key={q.id} className={cn("rounded-lg border px-3 py-2.5", answered ? "border-confirmed-200 bg-surface" : "border-dashed border-line-strong bg-surface")}>
              <p className={cn("flex gap-2 text-[13.5px] font-medium", answered && "text-ink-muted line-through decoration-ink-faint/50")}>{q.question}</p>
              {answered ? (
                <button type="button" onClick={() => openDetail({ type: "finding", id: answered })} className="mt-1 text-xs font-medium text-confirmed-600 hover:underline">
                  Answered by new evidence — view
                </button>
              ) : (
                <p className="mt-0.5 text-xs text-ink-subtle">{q.whyItMatters}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function NextStepSummary({ href }: { href: string }) {
  const { workspace, nextStepAcceptedAt } = useWorkspace();
  const step = workspace.nextStep;
  const type = nextStepTypeLabel[step.type];
  return (
    <section className="flex flex-col gap-4 rounded-xl border-2 border-brand-200 bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind="recommendation" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">Recommended next step</span>
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", type.className)}>{type.label}</span>
          {nextStepAcceptedAt && <span className="text-xs font-medium text-confirmed-600">Accepted</span>}
        </div>
        <p className="mt-1.5 text-[15px] font-semibold leading-snug">{step.title}</p>
        <p className="mt-0.5 text-[13px] text-ink-muted">{step.detail}</p>
      </div>
      <Link
        href={href}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-[13px] font-medium text-white hover:bg-brand-700"
      >
        Why this step <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

function RelatedMemory() {
  const { workspace } = useWorkspace();
  if (!workspace.relatedMemory.length) return null;
  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold text-violet-700">
        <Brain className="h-4 w-4" /> From Business Memory
      </h2>
      <ul className="mt-2 space-y-2">
        {workspace.relatedMemory.map((m) => (
          <li key={m.id} className="text-[13px] text-ink">
            <span className="font-medium">{m.title}.</span> <span className="text-ink-muted">{m.body}</span>{" "}
            {m.sourceInvestigationTitle && <span className="text-xs text-ink-subtle">— {m.sourceInvestigationTitle}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

const methodStatus = {
  done: { label: "Done", className: "bg-confirmed-50 text-confirmed-600" },
  "in-progress": { label: "In progress", className: "bg-brand-50 text-brand-700" },
  planned: { label: "Planned", className: "bg-slate-100 text-slate-600" },
} as const;

/** The adaptive plan: which methods this investigation uses, and which it deliberately doesn't. */
function PlanSection() {
  const { workspace } = useWorkspace();
  const plan = workspace.plan;
  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-wide">
        <Compass className="h-4 w-4 text-brand-600" /> Investigation plan
      </h2>
      <p className="mt-1 text-[13px] text-ink-muted">{plan.summary}</p>
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {plan.methods.map((m) => (
            <li key={m.id} className="rounded-lg border border-line px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13.5px] font-medium">{m.name}</p>
                {m.status && <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-medium", methodStatus[m.status].className)}>{methodStatus[m.status].label}</span>}
              </div>
              {m.uses && <p className="mt-0.5 text-[11.5px] text-ink-subtle">{m.uses.join(" · ")}</p>}
            </li>
          ))}
        </ul>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Not used — and why</p>
          <ul className="mt-2 space-y-2">
            {plan.notUsed.map((n) => (
              <li key={n.name} className="flex gap-2 text-[13px]">
                <CircleSlash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
                <span>
                  <span className="font-medium text-ink-muted">{n.name}.</span> <span className="text-ink-subtle">{n.why}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** How the investigation started: trigger, outcome and the answers to Veyra's questions. */
function Brief() {
  const { workspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const inv = workspace.investigation;
  return (
    <section className="rounded-xl border border-line bg-surface shadow-card">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-5 text-left">
        <span>
          <span className="block text-[15px] font-semibold uppercase tracking-wide">Investigation brief</span>
          <span className="mt-0.5 block text-xs text-ink-subtle">
            Trigger: {triggerLabel(inv.trigger)} · Outcome: {outcomeLabel(inv.outcome)} · {workspace.questions.length} contextual questions
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-line p-5">
          {workspace.questions.map((q, i) => (
            <QuestionCard key={q.id} index={i + 1} question={q} />
          ))}
        </div>
      )}
    </section>
  );
}

/** The team's own investigation: what's saved, what's been found, and what moves it forward. */
function LiveOverview({ live, tab }: { live: LiveInvestigation; tab: (slug: string) => string }) {
  const { workspace } = useWorkspace();
  const { record, dataSources } = live;
  const inv = workspace.investigation;
  const sources = record.dataSourceIds.map((d) => dataSources.find((x) => x.id === d)).filter((d): d is DataSource => !!d);
  const unanswered = record.questions.filter((q) => !q.answer.trim()).length;

  return (
    <div className="mt-6 space-y-6">
      {workspace.evidence.length ? (
        <AnalysisSection investigationId={inv.id} runs={record.analysisRuns} uploads={record.uploads} />
      ) : (
        <section className="rounded-xl border-2 border-brand-200 bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Upload className="h-4 w-4 text-brand-600" /> Start by adding data
          </h2>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Upload a CSV export — events, sign-ups, orders or support tickets. Veyra checks what it contains, then analyses it against
            this problem.
          </p>
          <div className="mt-4">
            <DataUploader investigationId={inv.id} />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <WhatWeKnow href={tab("findings")} />
        <WhatWeDontKnow href={tab("research")} />
      </div>

      {live.run && <NextStepSummary href={tab("next-step")} />}

      {workspace.hypotheses.length > 0 && (
        <section>
          <SectionHeader title="Active Hypotheses" href={tab("hypotheses")} linkLabel="All hypotheses" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {workspace.hypotheses.map((h) => (
              <HypothesisCard key={h.id} hypothesis={h} compact />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-semibold uppercase tracking-wide">Clarifying questions</h2>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {record.questions.length === 0
              ? "No questions were asked for this investigation."
              : unanswered
                ? `${unanswered} unanswered — Veyra treats these as unknowns until you answer them.`
                : "All answered. You can still change your answers."}
          </p>
          {record.questions.length > 0 && <AnswersEditor investigationId={inv.id} questions={record.questions} />}
        </section>

        <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
          <h2 className="text-[15px] font-semibold uppercase tracking-wide">Context</h2>
          <dl className="mt-3 space-y-3 text-[13px]">
            <ContextItem label="Objective" value={record.objective || "Not given"} />
            <ContextItem label="What triggered it" value={record.trigger ? triggerLabel(record.trigger) : "Not given"} />
            <ContextItem label="Outcome wanted" value={record.outcome ? outcomeLabel(record.outcome) : "Not given"} />
            <ContextItem label="What you already know" value={record.knownContext || "Nothing added"} />
            <ContextItem label="Data sources named" value={sources.length ? sources.map((d) => d.name).join(", ") : "None"} />
            {record.attachments.length > 0 && <ContextItem label="Attached" value={record.attachments.join(", ")} />}
          </dl>
          <p className="mt-4 flex gap-1.5 text-xs text-ink-faint">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" /> Live connections to tools come later. For now, upload exports from them as CSV.
          </p>
        </section>
      </div>

      {workspace.plan.methods.length > 0 && <PlanSection />}

      <DeleteInvestigationButton investigationId={inv.id} title={inv.title} />
    </div>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-ink">{value}</dd>
    </div>
  );
}
