"use client";

import { ArrowRight, Compass, Lock, RefreshCw, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { defineInvestigationProblem, findInvestigationOpportunities, setOpportunityStatus } from "@/app/(app)/investigations/actions";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { KindBadge } from "@/components/ui/KindBadge";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { EvidenceLink, LiveInvestigation, OpportunityRecord } from "@/lib/types";
import { FindingChip } from "./ArtifactChips";
import { EvidenceCitation } from "./EvidenceCitation";
import { useWorkspace } from "./workspace-context";

/** Runs one of the discovery steps and refreshes the page when it's done. */
function RunStep({ label, busyLabel, run, variant = "primary" }: { label: string; busyLabel: string; run: () => Promise<{ ok: true } | { error: string }>; variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function go() {
    setBusy(true);
    setError(null);
    try {
      const r = await run();
      if ("error" in r) setError(r.error);
      else router.refresh();
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
    }
    setBusy(false);
  }
  return (
    <div>
      <Button type="button" variant={variant} size="sm" onClick={go} disabled={busy}>
        {busy ? <Spinner /> : variant === "primary" ? <Sparkles className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />} {busy ? busyLabel : label}
      </Button>
      {busy && <p className="mt-1.5 text-xs text-ink-subtle">This usually takes about a minute.</p>}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Facet({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="rounded-lg bg-canvas px-3.5 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] leading-relaxed text-ink">{value}</dd>
    </div>
  );
}

function Bullets({ title, items, tone = "neutral" }: { title: string; items: string[]; tone?: "neutral" | "uncertain" }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</h3>
      <ul className="space-y-1">
        {items.map((a) => (
          <li key={a} className="flex gap-2 text-[13px] leading-relaxed text-ink">
            <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", tone === "uncertain" ? "bg-uncertain-600" : "bg-brand-500")} />
            {a}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Citations({ links }: { links: EvidenceLink[] }) {
  if (!links.length) return null;
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">Evidence</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <EvidenceCitation key={l.evidenceId} evidenceId={l.evidenceId} relation={l.relation} shows={l.shows} />
        ))}
      </ul>
    </section>
  );
}

function Basis({ findingRefs, hypothesisRefs = [] }: { findingRefs: string[]; hypothesisRefs?: string[] }) {
  const { workspace, openDetail } = useWorkspace();
  const findings = findingRefs.filter((f) => workspace.findings.some((x) => x.id === f));
  const hypotheses = hypothesisRefs.map((h) => workspace.hypotheses.find((x) => x.id === h)).filter((h) => !!h);
  if (!findings.length && !hypotheses.length) return null;
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">Rests on</h3>
      <div className="flex flex-col items-start gap-1.5">
        {findings.map((f) => (
          <FindingChip key={f} id={f} />
        ))}
        {hypotheses.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => openDetail({ type: "hypothesis", id: h.id })}
            className="inline-flex max-w-full items-start gap-1.5 rounded-md border border-dashed border-uncertain-600/40 bg-surface px-2 py-1 text-left text-xs text-ink-muted hover:border-brand-300"
          >
            <KindBadge kind="hypothesis" />
            <span>{h.title ?? h.statement}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Problem tab for the team's own investigation: the refined problem, written on request after the analysis. */
export function LiveProblem({ live }: { live: LiveInvestigation }) {
  const { workspace } = useWorkspace();
  const d = live.record.problemDefinition;
  const original = (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">The problem as you described it</p>
      <p className="mt-1 text-lg text-ink-muted">&ldquo;{live.record.summary.problem}&rdquo;</p>
    </section>
  );

  if (!live.run) {
    return (
      <div className="mt-6 max-w-4xl space-y-4">
        {original}
        <EmptyNote>Analyse your data first. Veyra defines the problem from the findings and hypotheses, each tied to the evidence.</EmptyNote>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="mt-6 max-w-4xl space-y-4">
        {original}
        <section className="rounded-xl border-2 border-brand-200 bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Target className="h-4 w-4 text-brand-600" /> Define the problem
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
            From the {workspace.findings.length} findings and {workspace.hypotheses.length} hypotheses, Veyra writes who is affected, what
            they&rsquo;re trying to do, what gets in their way and what it costs the business — a problem, not a solution.
          </p>
          <div className="mt-4">
            <RunStep label="Define the problem" busyLabel="Defining the problem…" run={() => defineInvestigationProblem(workspace.investigation.id)} />
          </div>
        </section>
      </div>
    );
  }

  const stale = d.runId !== live.run.id;
  return (
    <div className="mt-6 max-w-4xl space-y-4">
      {original}
      {stale && (
        <div className="flex flex-col gap-3 rounded-xl border border-uncertain-200 bg-uncertain-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-uncertain-600">This definition comes from an earlier analysis. Define it again to use the latest findings.</p>
          <RunStep label="Define again" busyLabel="Defining…" variant="secondary" run={() => defineInvestigationProblem(workspace.investigation.id)} />
        </div>
      )}

      <section className="rounded-xl border-2 border-brand-200 bg-surface p-5 shadow-raised sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            <Target className="h-4 w-4" /> Problem definition
          </p>
          <ConfidenceBadge level={d.confidence} />
        </div>
        <p className="mt-2 text-lg font-semibold leading-snug sm:text-xl">&ldquo;{d.statement}&rdquo;</p>
        {d.confidenceReason && <p className="mt-1.5 text-[13px] text-ink-subtle">{d.confidenceReason}</p>}

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Facet label="Who is affected" value={d.affected} />
          <Facet label="What they're trying to do" value={d.need} />
          <Facet label="What gets in the way" value={d.obstacle} />
          <Facet label="Business impact" value={d.businessImpact} />
        </dl>

        <div className="mt-5 space-y-5 border-t border-line pt-4">
          <Bullets title="Unresolved assumptions" items={d.assumptions} tone="uncertain" />
          <Citations links={d.links} />
          <Basis findingRefs={d.findingRefs} hypothesisRefs={d.hypothesisRefs} />
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-muted">
          This is a problem, not a solution. Next: the opportunity areas that address it.
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {!stale && <RunStep label="Define again" busyLabel="Defining…" variant="secondary" run={() => defineInvestigationProblem(workspace.investigation.id)} />}
          <Link
            href={routes.investigation(workspace.investigation.id, "opportunities")}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
          >
            Opportunities <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<OpportunityRecord["status"], string> = { open: "Open", pursuing: "Pursuing", parked: "Parked" };
const IMPACT_LABEL = { low: "Low", medium: "Medium", high: "High" } as const;

/** Opportunities tab for the team's own investigation: areas worth pursuing, found from the problem definition. */
export function LiveOpportunities({ live }: { live: LiveInvestigation }) {
  const { workspace } = useWorkspace();
  const d = live.record.problemDefinition;
  const list = live.record.opportunities;
  const id = workspace.investigation.id;

  if (!d) {
    return (
      <div className="mt-6 max-w-4xl">
        <EmptyNote>
          Opportunities come after the problem is defined.{" "}
          <Link href={routes.investigation(id, "problem")} className="font-medium text-brand-600 hover:text-brand-700">
            Define the problem first
          </Link>
          .
        </EmptyNote>
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-5xl space-y-5">
      <section className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">For the problem</p>
        <p className="mt-1 text-[14.5px] font-medium text-ink">&ldquo;{d.statement}&rdquo;</p>
      </section>

      {list.length === 0 ? (
        <section className="rounded-xl border-2 border-brand-200 bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Compass className="h-4 w-4 text-brand-600" /> Find opportunities
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
            Veyra finds two to four areas worth pursuing for this problem — customer outcomes, not features — each with its evidence,
            potential impact, assumptions and what to validate first.
          </p>
          <div className="mt-4">
            <RunStep label="Find opportunities" busyLabel="Finding opportunities…" run={() => findInvestigationOpportunities(id)} />
          </div>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold">Opportunity areas</h2>
            <RunStep label="Find again" busyLabel="Finding…" variant="secondary" run={() => findInvestigationOpportunities(id)} />
          </div>
          <div className="space-y-3">
            {list.map((o, i) => (
              <LiveOpportunityCard key={o.id} o={o} index={i + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LiveOpportunityCard({ o, index }: { o: OpportunityRecord; index: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(index === 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(status: OpportunityRecord["status"]) {
    setSaving(true);
    setError(null);
    const r = await setOpportunityStatus(o.id, status).catch(() => ({ error: "Couldn't reach Veyra. Try again." }));
    if ("error" in r) setError(r.error);
    else router.refresh();
    setSaving(false);
  }

  return (
    <article className={cn("rounded-xl border bg-surface shadow-card", o.status === "pursuing" ? "border-2 border-confirmed-600/50" : "border-line", o.status === "parked" && "opacity-70")}>
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Opportunity {index}</p>
          <div className="flex items-center gap-2">
            {saving && <Spinner />}
            <label className="sr-only" htmlFor={`status-${o.id}`}>
              Status
            </label>
            <select
              id={`status-${o.id}`}
              value={o.status}
              onChange={(e) => changeStatus(e.target.value as OpportunityRecord["status"])}
              disabled={saving}
              className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium text-ink"
            >
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <h3 className="mt-1.5 text-[16px] font-semibold leading-snug">{o.title}</h3>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted">{o.customerProblem}</p>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <div>
            <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Potential impact</dt>
            <dd className="mt-0.5 font-medium text-ink">{IMPACT_LABEL[o.impactLevel]}</dd>
          </div>
          <div>
            <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Confidence</dt>
            <dd>
              <ConfidenceBadge level={o.confidence} bare className="-ml-1.5 bg-transparent" />
            </dd>
          </div>
        </dl>
        {error && (
          <p role="alert" className="mt-2 text-xs text-danger-600">
            {error}
          </p>
        )}
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-3 text-xs font-medium text-brand-600 hover:text-brand-700">
          {open ? "Hide details" : "Impact, assumptions, what to validate and evidence"}
        </button>
      </div>
      {open && (
        <div className="space-y-5 border-t border-line p-5">
          {o.potentialImpact && (
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">What it could change</h3>
              <p className="text-[13px] leading-relaxed text-ink">{o.potentialImpact}</p>
            </section>
          )}
          <Bullets title="Assumptions" items={o.assumptions} tone="uncertain" />
          <Bullets title="Validate before pursuing" items={o.validationNeeds} />
          <Citations links={o.links} />
          <Basis findingRefs={o.findingRefs} />
        </div>
      )}
      <div className="flex gap-2 border-t border-line bg-canvas/60 px-5 py-3 text-xs text-ink-subtle">
        <Lock className="mt-px h-3.5 w-3.5 shrink-0" />
        {o.status === "pursuing"
          ? "Solution directions for this opportunity come in the next milestone, once you've validated what's above."
          : "Solution directions open for opportunities you choose to pursue, after their assumptions are validated."}
      </div>
    </article>
  );
}
