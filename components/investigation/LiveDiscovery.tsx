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
import { SUPPORTED, VERDICT_LABEL } from "@/lib/verdicts";

/** Runs one of the discovery steps and refreshes the page when it's done. */
export function RunStep({ label, busyLabel, run, variant = "primary" }: { label: string; busyLabel: string; run: () => Promise<{ ok: true } | { error: string }>; variant?: "primary" | "secondary" }) {
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

function Facet({ label, value, uncertain }: { label: string; value: string; uncertain?: boolean }) {
  if (!value.trim()) return null;
  return (
    <div className={cn("rounded-lg px-3.5 py-3", uncertain ? "border border-dashed border-uncertain-600/40 bg-uncertain-50/60" : "bg-canvas")}>
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
  const confirmed = workspace.hypotheses.filter((h) => h.status === "confirmed");
  const likely = workspace.hypotheses.filter((h) => h.status === "likely");
  // Defining again helps once a cause is confirmed (and the definition isn't yet), or likely (and the definition is still provisional).
  const better = confirmed.length ? (d.causeStatus !== "validated" ? confirmed : []) : d.causeStatus === "open" ? likely : [];
  return (
    <div className="mt-6 max-w-4xl space-y-4">
      {original}
      {better.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-confirmed-200 bg-confirmed-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-confirmed-600">
            <b className="font-semibold">
              {better.map((h) => h.label).join(", ")} {confirmed.length ? "confirmed" : "likely"}.
            </b>{" "}
            Define the problem again to fill in what gets in the way. {confirmed.length ? "It stops being provisional." : "It becomes the likely cause."}
          </p>
          <RunStep label="Define again" busyLabel="Defining…" run={() => defineInvestigationProblem(workspace.investigation.id)} />
        </div>
      )}
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
            {d.causeStatus === "open" ? (
              <span className="rounded bg-uncertain-50 px-1.5 py-0.5 text-[10.5px] tracking-wide text-uncertain-600">Provisional</span>
            ) : d.causeStatus === "likely" ? (
              <span className="rounded bg-confirmed-50/60 px-1.5 py-0.5 text-[10.5px] tracking-wide text-confirmed-600">Likely cause</span>
            ) : (
              <span className="rounded bg-confirmed-50 px-1.5 py-0.5 text-[10.5px] tracking-wide text-confirmed-600">Cause validated</span>
            )}
          </p>
          <ConfidenceBadge level={d.confidence} />
        </div>
        <p className="mt-2 text-lg font-semibold leading-snug sm:text-xl">&ldquo;{d.statement}&rdquo;</p>
        {d.confidenceReason && <p className="mt-1.5 text-[13px] text-ink-subtle">{d.confidenceReason}</p>}

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Facet label="Who is affected" value={d.affected} />
          <Facet label="What they're trying to do" value={d.need} />
          <Facet
            label={d.causeStatus === "open" ? "What gets in the way — not yet known" : d.causeStatus === "likely" ? "What gets in the way — likely, not confirmed" : "What gets in the way"}
            value={d.obstacle}
            uncertain={d.causeStatus !== "validated"}
          />
          <Facet label="Business impact" value={d.businessImpact} />
        </dl>

        {d.causeStatus === "open" && <WhyProvisional />}

        <div className="mt-5 space-y-5 border-t border-line pt-4">
          <Bullets title="Unresolved assumptions" items={d.assumptions} tone="uncertain" />
          <Citations links={d.links} />
          {/* While the cause is open, hypotheses are possible explanations (named above), not what the problem rests on. */}
          <Basis findingRefs={d.findingRefs} hypothesisRefs={d.causeStatus !== "open" ? d.hypothesisRefs : []} />
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-muted">
          This is a problem, not a solution. Next: the opportunity areas that address it.
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {/* While provisional, defining again only helps once a hypothesis is confirmed (banner above) or the analysis is newer. */}
          {!stale && d.causeStatus !== "open" && !better.length && (
            <RunStep label="Define again" busyLabel="Defining…" variant="secondary" run={() => defineInvestigationProblem(workspace.investigation.id)} />
          )}
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

const HYPOTHESIS_STATE = {
  open: { label: "Not validated yet", className: "bg-slate-100 text-slate-600" },
  unclear: { label: "Unclear", className: "bg-uncertain-50 text-uncertain-600" },
  unlikely: { label: "Unlikely", className: "bg-slate-100 text-slate-600" },
  rejected: { label: "Ruled out", className: "bg-slate-100 text-slate-500 line-through" },
  likely: { label: "Likely", className: "bg-confirmed-50/60 text-confirmed-600" },
  confirmed: { label: "Confirmed", className: "bg-confirmed-50 text-confirmed-600" },
} as const;

/**
 * Why the definition is provisional and what ends it: a confirmed hypothesis
 * about the cause, then defining the problem again. Lists each hypothesis's state.
 */
function WhyProvisional() {
  const { workspace } = useWorkspace();
  const id = workspace.investigation.id;
  const candidates = workspace.hypotheses.filter((h) => h.status !== "rejected");
  return (
    <div className="mt-4 rounded-lg bg-uncertain-50 px-3.5 py-3 text-[13px] text-uncertain-600">
      <p>
        <b className="font-semibold">Provisional</b> until Veyra&rsquo;s validation finds a hypothesis about the cause <b className="font-semibold">likely</b> or{" "}
        <b className="font-semibold">confirmed</b>. It rests on findings only, so what gets in the way isn&rsquo;t known yet. Once one is, a &ldquo;Define
        again&rdquo; button appears above and the new definition names the cause. An unclear, unlikely or rejected result doesn&rsquo;t change it.
      </p>
      {workspace.hypotheses.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {workspace.hypotheses.map((h) => {
            const st = HYPOTHESIS_STATE[h.status ?? "open"];
            return (
              <li key={h.id} className="flex items-start gap-2 text-ink">
                <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-semibold", st.className)}>
                  {h.label} · {st.label}
                </span>
                <span className={cn("text-[12.5px]", h.status === "rejected" && "text-ink-subtle line-through")}>{h.title ?? h.statement}</span>
              </li>
            );
          })}
        </ul>
      )}
      <Link href={routes.investigation(id, "validation")} className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
        {candidates.some((h) => h.status === "unclear") ? "Strengthen or validate a hypothesis" : "Validate a hypothesis"} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
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
        {d.causeStatus === "open" && (
          <p className="mt-2 text-xs text-uncertain-600">
            The cause isn&rsquo;t validated yet, so these opportunities don&rsquo;t assume one: each holds whatever the cause turns out to be.
          </p>
        )}
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
  const { workspace } = useWorkspace();
  const router = useRouter();
  const dependencies = o.dependsOn.map((ref) => ({ ref, h: workspace.hypotheses.find((x) => x.id === ref) }));
  const unconfirmed = dependencies.filter((d) => !SUPPORTED(d.h?.status));
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
          {dependencies.length > 0 && (
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">Assumes these hypotheses are true</h3>
              <ul className="space-y-1">
                {dependencies.map(({ ref, h }) => (
                  <li key={ref} className="flex items-start gap-2 text-[13px] text-ink">
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-semibold",
                        SUPPORTED(h?.status) ? "bg-confirmed-50 text-confirmed-600" : "bg-uncertain-50 text-uncertain-600",
                      )}
                    >
                      {ref} · {h?.status && h.status !== "open" ? VERDICT_LABEL[h.status] : "Not validated"}
                    </span>
                    {h?.title ?? h?.statement ?? ""}
                  </li>
                ))}
              </ul>
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
        {unconfirmed.length
          ? `Pursuing it waits on validating ${unconfirmed.map((d) => d.ref).join(", ")} (Validation tab).`
          : o.status === "pursuing"
            ? "Pursuing. The Decision Brief suggests solution directions once a hypothesis about the cause is confirmed."
            : "Solution directions open for opportunities you choose to pursue, once the cause is validated."}
      </div>
    </article>
  );
}
