"use client";

import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Link2, Paperclip, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { OptionGrid } from "@/components/onboarding/OptionGrid";
import { Button } from "@/components/ui/Button";
import { inputClass, textareaClass } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { emptyDraft } from "@/lib/data/investigations";
import { OUTCOMES, TRIGGERS } from "@/lib/options";
import { routes } from "@/lib/routes";
import { appActions, useAppState, useHydrated } from "@/lib/store/app-store";
import type { BusinessContext, DataSource, InvestigationDraft } from "@/lib/types";
import { NewInvestigationSteps } from "./NewInvestigationSteps";

type Props = { dataSources: DataSource[]; context: BusinessContext; examples: string[] };

export function NewInvestigationFlow(props: Props) {
  // The form is seeded from saved state, so wait until it's readable.
  const hydrated = useHydrated();
  return hydrated ? <FlowInner {...props} /> : <div className="min-h-[60vh]" />;
}

/**
 * What the flow starts with: a problem picked on the dashboard wins, then a
 * draft the user is returning to, then a blank form.
 */
function useInitialDraft(dataSources: DataSource[]): InvestigationDraft {
  const searchParams = useSearchParams();
  const { draft } = useAppState();
  const fromDashboard = searchParams.get("problem")?.trim();
  const connected = dataSources.filter((s) => s.status === "connected").map((s) => s.id);
  if (fromDashboard && fromDashboard !== draft?.problem) return { ...emptyDraft(fromDashboard), dataSourceIds: connected };
  return draft ?? { ...emptyDraft(), dataSourceIds: connected };
}

const STEP_TITLES = [
  "What problem are you trying to understand?",
  "What triggered this, and what outcome do you need?",
  "What do you already know, and what can Veyra use?",
];

function FlowInner({ dataSources, context, examples }: Props) {
  const router = useRouter();
  const { draft: saved } = useAppState();
  const initial = useInitialDraft(dataSources); // only the first render's value is used below
  const [step, setStep] = useState(0);
  const [d, setD] = useState<InvestigationDraft>(initial);
  const update = (patch: Partial<InvestigationDraft>) => setD((cur) => ({ ...cur, ...patch }));

  const canContinue = [d.problem.trim().length > 0, d.trigger !== null && d.outcome !== null, d.dataSourceIds.length > 0][step];

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canContinue) return;
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    const next: InvestigationDraft = { ...d, problem: d.problem.trim() };
    // Keep generated questions and plan unless the problem itself changed.
    const unchanged = saved && saved.problem === next.problem && saved.trigger === next.trigger;
    appActions.saveDraft(unchanged ? { ...next, questions: saved.questions, plan: saved.plan } : next);
    router.push(routes.clarifyingQuestions);
  }

  return (
    <form onSubmit={next} className="mx-auto max-w-4xl px-4 py-8 sm:px-8 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        {step === 0 ? (
          <Link href={routes.dashboard} className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        ) : (
          <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        <NewInvestigationSteps current={step} />
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-600">New investigation</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">{STEP_TITLES[step]}</h1>

      <div className="mt-6 space-y-5">
        {step === 0 && <ProblemStep draft={d} update={update} examples={examples} />}
        {step === 1 && <ContextStep draft={d} update={update} />}
        {step === 2 && <EvidenceStep draft={d} update={update} dataSources={dataSources} context={context} />}
      </div>

      <div className="mt-8 flex items-center justify-end border-t border-line pt-6">
        <Button type="submit" size="lg" disabled={!canContinue}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

type StepProps = { draft: InvestigationDraft; update: (patch: Partial<InvestigationDraft>) => void };

function ProblemStep({ draft, update, examples }: StepProps & { examples: string[] }) {
  return (
    <>
      <p className="text-ink-muted">Describe the business or product problem in your own words. It doesn&rsquo;t need to be precise — Veyra will help refine it.</p>
      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <label htmlFor="problem" className="sr-only">
          The problem
        </label>
        <textarea
          id="problem"
          rows={3}
          autoFocus
          value={draft.problem}
          onChange={(e) => update({ problem: e.target.value })}
          placeholder="Our DAU dropped 40%."
          className={`${textareaClass} text-base`}
        />
        <p className="mt-4 text-xs font-medium text-ink-subtle">Examples</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {examples.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                onClick={() => update({ problem: ex })}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[13px] transition-colors",
                  draft.problem === ex ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-canvas/60 text-ink-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function ContextStep({ draft, update }: StepProps) {
  return (
    <>
      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-semibold">What triggered this investigation?</h2>
        <p className="mb-4 mt-0.5 text-[13px] text-ink-subtle">Helps Veyra decide where to start looking.</p>
        <OptionGrid
          ariaLabel="Trigger"
          columns={3}
          options={TRIGGERS.map((t) => ({ value: t.value, title: t.label }))}
          selected={draft.trigger ? [draft.trigger] : []}
          onToggle={(v) => update({ trigger: v })}
        />
      </section>
      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-semibold">What outcome are you trying to achieve?</h2>
        <p className="mb-4 mt-0.5 text-[13px] text-ink-subtle">Veyra chooses methods to match — explaining a change needs different evidence than evaluating a market.</p>
        <OptionGrid
          ariaLabel="Outcome"
          columns={3}
          options={OUTCOMES.map((o) => ({ value: o.value, title: o.label }))}
          selected={draft.outcome ? [draft.outcome] : []}
          onToggle={(v) => update({ outcome: v })}
        />
        <label htmlFor="objective" className="mt-5 block text-[13px] font-medium text-ink">
          In your own words: what do you want to achieve or decide? <span className="font-normal text-ink-subtle">(optional)</span>
        </label>
        <textarea
          id="objective"
          rows={2}
          value={draft.objective ?? ""}
          onChange={(e) => update({ objective: e.target.value })}
          placeholder="e.g. Decide whether to roll back the new onboarding flow before the Q4 campaign."
          className={`${textareaClass} mt-2`}
        />
      </section>
    </>
  );
}

const groupLabel: Record<DataSource["group"], string> = {
  "company-systems": "Company systems",
  "customer-evidence": "Customer evidence",
  external: "External research",
};

function EvidenceStep({ draft, update, dataSources, context }: StepProps & { dataSources: DataSource[]; context: BusinessContext }) {
  const [link, setLink] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const addAttachment = (name: string) => name && update({ attachments: [...draft.attachments, name] });
  const toggleSource = (id: string) =>
    update({ dataSourceIds: draft.dataSourceIds.includes(id) ? draft.dataSourceIds.filter((x) => x !== id) : [...draft.dataSourceIds, id] });

  return (
    <>
      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <label htmlFor="known" className="text-[15px] font-semibold">
          What do you already know?
        </label>
        <p className="mt-0.5 text-[13px] text-ink-subtle">Anything that might matter: dates, releases, campaigns, what customers have said. Optional.</p>
        <textarea id="known" rows={3} value={draft.knownContext} onChange={(e) => update({ knownContext: e.target.value })} className={`${textareaClass} mt-3`} />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
            <Paperclip className="h-3.5 w-3.5" /> Add files or research
          </Button>
          <input ref={fileInput} type="file" className="sr-only" aria-label="File" onChange={(e) => addAttachment(e.target.files?.[0]?.name ?? "")} />
          <div className="flex items-center gap-1.5">
            <label htmlFor="known-link" className="sr-only">
              Link
            </label>
            <input id="known-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste a link" className={`${inputClass} h-8 w-52 text-[13px]`} />
            <Button type="button" variant="ghost" size="sm" disabled={!link.trim()} onClick={() => (addAttachment(link.trim()), setLink(""))}>
              <Link2 className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
        {draft.attachments.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {draft.attachments.map((a) => (
              <li key={a} className="flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-1 text-xs text-ink-muted">
                {a}
                <button type="button" aria-label={`Remove ${a}`} onClick={() => update({ attachments: draft.attachments.filter((x) => x !== a) })}>
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-canvas px-3.5 py-3">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-[13px] text-ink-muted">
            {[context.product, context.businessModel, context.targetCustomers].some(Boolean) ? (
              <>
                <span className="font-medium text-ink">Business context is included automatically:</span>{" "}
                {[context.product, context.businessModel, context.targetCustomers].filter(Boolean).join(" · ")}.{" "}
                <Link href={routes.context} className="font-medium text-brand-600 hover:text-brand-700">
                  View
                </Link>
              </>
            ) : (
              <>
                <span className="font-medium text-ink">No business context yet.</span> Adding it makes every investigation more relevant.{" "}
                <Link href={routes.context} className="font-medium text-brand-600 hover:text-brand-700">
                  Add it
                </Link>
              </>
            )}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-semibold">What data can Veyra access?</h2>
        <p className="mt-0.5 text-[13px] text-ink-subtle">Veyra investigates your own systems first. Choose what it may use for this investigation.</p>
        {(["company-systems", "customer-evidence"] as const).map((group) => (
          <div key={group} className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{groupLabel[group]}</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dataSources
                .filter((s) => s.group === group)
                .map((s) => {
                  const connected = s.status === "connected";
                  const checked = draft.dataSourceIds.includes(s.id);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        disabled={!connected}
                        onClick={() => toggleSource(s.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                          !connected && "cursor-not-allowed border-dashed border-line-strong bg-canvas/50",
                          connected && checked && "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500",
                          connected && !checked && "border-line hover:border-line-strong",
                        )}
                      >
                        {connected ? (
                          <CheckCircle2 className={cn("h-4 w-4 shrink-0", checked ? "text-brand-600" : "text-line-strong")} />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-dashed border-line-strong" />
                        )}
                        <span className="min-w-0">
                          <span className={cn("block text-[13.5px] font-medium", connected ? "text-ink" : "text-ink-faint")}>{s.name}</span>
                          <span className="block truncate text-[11px] text-ink-faint">
                            {connected ? s.metrics?.map((m) => `${m.value} ${m.label.toLowerCase()}`).join(" · ") : "Not connected"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
        <Link href={routes.dataSources} className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
          <Plus className="h-3.5 w-3.5" /> Add data source
        </Link>
        <p className="mt-3 text-xs text-ink-faint">Preview: connections are simulated with realistic sample data.</p>
      </section>
    </>
  );
}
