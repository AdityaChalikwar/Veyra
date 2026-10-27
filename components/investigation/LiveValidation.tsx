"use client";

import { Check, ChevronDown, Circle, CircleCheck, CircleHelp, FlaskConical, Pencil, Play, Plus, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { rerunWithEvidence, resumeRun, runValidation } from "@/app/(app)/investigations/run-actions";
import Link from "next/link";
import { readiness, suggestNext } from "@/lib/investigation/guide";
import { routes } from "@/lib/routes";
import { ACTIVE_PHASES } from "@/lib/validation-run/types";
import { RunPanel } from "./ValidationRun";
import {
  addValidationDataset,
  addValidationNote,
  checkCall,
  deleteValidation,
  planValidation,
  removeValidationEvidence,
  reopenValidation,
  settleValidation,
  updateValidationPlan,
} from "@/app/(app)/investigations/validation-actions";
import { coveredNeeds, EVIDENCE_SOURCES, MAX_NEEDS, type EvidenceNeed, type EvidenceSource } from "@/lib/analysis/evidence-needs";
import type { CallCheck } from "@/lib/analysis/validation";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { inputClass, textareaClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/time";
import type { Hypothesis, LiveInvestigation, ValidationRecord } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

type Result = { ok: true } | { error: string };
const OFFLINE = { error: "Couldn't reach Veyra. Check your connection and try again." };

/** Runs a server action, then refreshes the page; keeps the error to show. */
function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function run(key: string, action: () => Promise<Result>, after?: () => void) {
    setBusy(key);
    setError(null);
    const r = await action().catch(() => OFFLINE);
    if ("error" in r) setError(r.error);
    else {
      after?.();
      router.refresh();
    }
    setBusy(null);
  }
  return { busy, error, run };
}

const STATUS: Record<string, { label: string; className: string }> = {
  none: { label: "Not validated", className: "bg-slate-100 text-slate-600" },
  planned: { label: "Planned", className: "bg-brand-50 text-brand-700" },
  "in-progress": { label: "Collecting evidence", className: "bg-brand-50 text-brand-700" },
  confirmed: { label: "Confirmed", className: "bg-confirmed-50 text-confirmed-600" },
  rejected: { label: "Rejected", className: "bg-slate-200 text-slate-700" },
  unclear: { label: "Unclear", className: "bg-uncertain-50 text-uncertain-600" },
};

const statusOf = (v?: ValidationRecord) => (!v ? "none" : v.status === "settled" ? (v.outcome ?? "unclear") : v.status);

/** Validation tab for the team's own investigation: test each hypothesis and settle it with evidence. */
export function LiveValidation({ live }: { live: LiveInvestigation }) {
  const { workspace } = useWorkspace();
  const validations = live.record.validations;
  useRunWatcher(live);
  if (!live.run) return <EmptyNote className="mt-6">Analyse your data first. Hypotheses to validate come from the analysis.</EmptyNote>;

  const linked = new Set(workspace.hypotheses.map((h) => h.validationId).filter(Boolean));
  const earlier = validations.filter((v) => !linked.has(v.id));
  const settled = validations.filter((v) => v.status === "settled");
  const next = suggestNext(workspace.hypotheses, live);
  const ready = readiness({ ...workspace, live });

  return (
    <div className="mt-6 max-w-4xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Validation</h2>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-subtle">
          A hypothesis is a guess until it is tested. Choose one and Veyra validates it: it fixes the test before looking, gathers evidence
          from your data, connected sources, uploaded text and the web, runs the numbers, challenges its own verdict and settles it. If something
          important is out of reach, it asks — add it or go ahead without it. You can always override the call.
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          {settled.length} of {workspace.hypotheses.length + earlier.length} settled
        </p>
      </div>
      {ready.ready && !live.record.decisions.length && (
        <div className="flex flex-col gap-2 rounded-xl border border-confirmed-200 bg-confirmed-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-confirmed-600">
            <b className="font-semibold">You have enough to decide.</b> {ready.reason} You can keep validating, but it&rsquo;s unlikely to change the decision.
          </p>
          <Link href={routes.investigation(workspace.investigation.id, "report")} className={buttonClass({ size: "sm", className: "shrink-0" })}>
            Go to the Decision Brief
          </Link>
        </div>
      )}
      {workspace.hypotheses.length === 0 && earlier.length === 0 && <EmptyNote>The latest analysis didn&rsquo;t propose any hypotheses.</EmptyNote>}
      {workspace.hypotheses.map((h) => (
        <ValidationCard key={h.id} hypothesis={h} validation={validations.find((v) => v.id === h.validationId)} live={live} suggested={next === h.id} />
      ))}
      {earlier.length > 0 && (
        <>
          <h3 className="pt-2 text-[13px] font-semibold text-ink-muted">From earlier analyses</h3>
          {earlier.map((v) => (
            <ValidationCard key={v.id} validation={v} live={live} />
          ))}
        </>
      )}
    </div>
  );
}

function ValidationCard({ hypothesis: h, validation: v, live, suggested }: { hypothesis?: Hypothesis; validation?: ValidationRecord; live: LiveInvestigation; suggested?: boolean }) {
  const { workspace } = useWorkspace();
  const { busy, error, run } = useAction();
  const s = STATUS[statusOf(v)];
  const title = h?.title ?? v?.hypothesisTitle ?? "";
  const statement = h?.statement ?? v?.hypothesisStatement ?? "";
  const rejected = v?.outcome === "rejected";
  const latest = v?.run;
  const running = !!latest && (ACTIVE_PHASES.includes(latest.phase) || latest.phase === "needs-input");
  const settledByVeyra = v?.status === "settled" && v.settledBy === "veyra";
  const runIt = () => run("run", () => (h ? runValidation(workspace.investigation.id, h.id) : latest ? rerunWithEvidence(latest.id) : Promise.resolve({ error: "Run it from the latest analysis." })));
  // Showing Veyra's run: while it works, when it asks, and its verdict while that verdict stands.
  const showRun = !!latest && (running || latest.phase === "failed" || (latest.phase === "completed" && (settledByVeyra || v?.status !== "settled")));

  return (
    <article className={cn("rounded-xl border bg-surface shadow-card", v?.outcome === "confirmed" ? "border-2 border-confirmed-600/50" : suggested ? "border-brand-300" : "border-line")}>
      <header className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {h && <span className="rounded-md border border-dashed border-uncertain-600/50 px-1.5 text-[13px] font-semibold text-uncertain-600">{h.label}</span>}
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", s.className)}>
            {running ? (latest?.phase === "needs-input" ? "Waiting for you" : "Veyra is validating") : s.label}
            {v?.status === "settled" && ` · by ${v.settledBy === "veyra" ? "Veyra" : "the team"}`}
            {v?.status === "settled" && v.confidence && ` · ${v.confidence} confidence`}
          </span>
          {suggested && !running && <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">Suggested next</span>}
        </div>
        <h3 className={cn("mt-2 text-[15px] font-semibold leading-snug", rejected && "text-ink-subtle line-through")}>{title || statement}</h3>
        {title && <p className={cn("mt-1 text-[13.5px] leading-relaxed text-ink-muted", rejected && "line-through")}>{statement}</p>}
      </header>

      {!running && v?.status !== "settled" && latest?.phase !== "failed" && (h || latest) && (
        <div className="flex flex-col gap-3 border-t border-line bg-canvas/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-muted">
            Veyra plans the test, gathers the evidence, runs it and settles it. Usually a few minutes.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            {!v && h && (
              <Button type="button" size="sm" variant="ghost" disabled={!!busy} onClick={() => run("manual", () => planValidation(workspace.investigation.id, h.id, false))}>
                {busy === "manual" ? <Spinner /> : <Pencil className="h-3.5 w-3.5" />} Do it myself
              </Button>
            )}
            <Button type="button" size="sm" disabled={!!busy} onClick={runIt}>
              {busy === "run" ? <Spinner /> : <Play className="h-3.5 w-3.5" />} Run validation
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="px-5 pb-4 text-[13px] text-danger-600">
          {error}
        </p>
      )}

      {showRun && latest && <RunPanel run={latest} onRunAgain={runIt} busyAgain={busy === "run"} />}

      {v && !running && (
        <details className="group border-t border-line" open={!latest && v.status !== "settled" ? true : undefined}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-[13px] font-medium text-ink-muted hover:text-ink">
            {settledByVeyra ? "Override: the plan, your own evidence and your call" : "The plan, the evidence and the call"}
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <Plan v={v} />
          <EvidenceSection v={v} live={live} />
          <Settle v={v} />
        </details>
      )}
    </article>
  );
}

/** Polls while Veyra works; if a run seems stuck (background chain blocked), moves it on from here. */
function useRunWatcher(live: LiveInvestigation) {
  const router = useRouter();
  const nudged = useRef(new Set<string>());
  const runs = live.record.validations.map((v) => v.run).filter((r) => !!r && ACTIVE_PHASES.includes(r.phase));
  const key = runs.map((r) => `${r!.id}:${r!.phase}:${r!.updatedAt}`).join("|");
  useEffect(() => {
    if (!runs.length) return;
    const timer = setInterval(() => router.refresh(), 4000);
    for (const r of runs) {
      const stale = Date.now() - new Date(r!.updatedAt).getTime() > 45_000;
      const free = !r!.leaseUntil || new Date(r!.leaseUntil).getTime() < Date.now();
      const mark = `${r!.id}:${r!.updatedAt}`;
      if (stale && free && !nudged.current.has(mark)) {
        nudged.current.add(mark);
        resumeRun(r!.id).then(() => router.refresh()).catch(() => {});
      }
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/**
 * Which hypothesis to validate next: one an opportunity depends on, then the
 * most confident, among those not yet settled or running.
 */
function Plan({ v }: { v: ValidationRecord }) {
  const { busy, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ method: v.method, test: v.test, confirmIf: v.confirmIf, rejectIf: v.rejectIf, evidenceNeeded: v.evidenceNeeded });
  const setNeed = (i: number, patch: Partial<EvidenceNeed>) =>
    setDraft((d) => ({ ...d, evidenceNeeded: d.evidenceNeeded.map((n, j) => (j === i ? { ...n, ...patch } : n)) }));
  const settled = v.status === "settled";

  if (editing) {
    return (
      <section className="space-y-3 border-t border-line p-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">The plan</h4>
        <input className={inputClass} placeholder="Method, e.g. Cohort comparison" value={draft.method} onChange={(e) => setDraft({ ...draft, method: e.target.value })} aria-label="Method" />
        <textarea className={textareaClass} rows={3} placeholder="What exactly you'll do" value={draft.test} onChange={(e) => setDraft({ ...draft, test: e.target.value })} aria-label="Test" />
        <textarea className={textareaClass} rows={2} placeholder="It's confirmed if…" value={draft.confirmIf} onChange={(e) => setDraft({ ...draft, confirmIf: e.target.value })} aria-label="Confirmed if" />
        <textarea className={textareaClass} rows={2} placeholder="It's rejected if…" value={draft.rejectIf} onChange={(e) => setDraft({ ...draft, rejectIf: e.target.value })} aria-label="Rejected if" />
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-muted">Evidence needed</p>
          {draft.evidenceNeeded.map((n, i) => (
            <div key={n.id || i} className="grid grid-cols-1 gap-2 rounded-lg border border-line p-2 sm:grid-cols-[1fr_10rem_12rem_auto]">
              <input className={inputClass} placeholder="What to collect" value={n.what} onChange={(e) => setNeed(i, { what: e.target.value })} aria-label={`Evidence ${i + 1}: what`} />
              <select className={inputClass} value={n.source} onChange={(e) => setNeed(i, { source: e.target.value as EvidenceSource })} aria-label={`Evidence ${i + 1}: source`}>
                {Object.entries(EVIDENCE_SOURCES).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              <input className={inputClass} placeholder="How much is enough" value={n.enough} onChange={(e) => setNeed(i, { enough: e.target.value })} aria-label={`Evidence ${i + 1}: enough`} />
              <button
                type="button"
                aria-label="Remove"
                onClick={() => setDraft((d) => ({ ...d, evidenceNeeded: d.evidenceNeeded.filter((_, j) => j !== i) }))}
                className="justify-self-start px-1 text-ink-faint hover:text-danger-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {draft.evidenceNeeded.length < MAX_NEEDS && (
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, evidenceNeeded: [...d.evidenceNeeded, { id: "", what: "", source: "data", enough: "" }] }))}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add evidence needed
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-[13px] text-danger-600">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={!!busy} onClick={() => run("save", () => updateValidationPlan(v.id, draft), () => setEditing(false))}>
            {busy === "save" && <Spinner />} Save plan
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-line p-5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          <FlaskConical className="h-3.5 w-3.5" /> The plan{v.method && <span className="normal-case tracking-normal text-ink-muted">· {v.method}</span>}
        </h4>
        <div className="flex gap-3">
          {!settled && (
            <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Edit
            </button>
          )}
          {!settled && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => confirm("Remove this validation and its evidence?") && run("delete", () => deleteValidation(v.id))}
              className="text-xs font-medium text-ink-subtle hover:text-danger-600"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink">{v.test || <span className="text-ink-faint">No test written yet. Edit the plan to add one.</span>}</p>
      {(v.confirmIf || v.rejectIf) && (
        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {v.confirmIf && (
            <div className="rounded-lg bg-confirmed-50/60 px-3 py-2">
              <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-confirmed-600">Confirmed if</dt>
              <dd className="mt-0.5 text-[13px] text-ink">{v.confirmIf}</dd>
            </div>
          )}
          {v.rejectIf && (
            <div className="rounded-lg bg-slate-100 px-3 py-2">
              <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-600">Rejected if</dt>
              <dd className="mt-0.5 text-[13px] text-ink">{v.rejectIf}</dd>
            </div>
          )}
        </dl>
      )}
      <Checklist v={v} />
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger-600">
          {error}
        </p>
      )}
    </section>
  );
}

/** The evidence the test needs, ticked off as the team collects it. */
function Checklist({ v }: { v: ValidationRecord }) {
  if (!v.evidenceNeeded.length) {
    return v.status === "settled" ? null : (
      <p className="mt-3 text-xs text-ink-subtle">No evidence checklist yet. Edit the plan to list what the test needs.</p>
    );
  }
  const covered = coveredNeeds(v.evidenceNeeded, [...v.notes, ...v.datasets]);
  return (
    <div className="mt-4">
      <h5 className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        Evidence needed
        <span className={cn("normal-case tracking-normal", covered.size === v.evidenceNeeded.length ? "text-confirmed-600" : "text-ink-subtle")}>
          {covered.size} of {v.evidenceNeeded.length} collected
        </span>
      </h5>
      <ul className="mt-1.5 space-y-1.5">
        {v.evidenceNeeded.map((n) => {
          const done = covered.has(n.id);
          return (
            <li key={n.id} className="flex items-start gap-2 text-[13px]">
              {done ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-confirmed-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />}
              <span className={cn(done ? "text-ink-muted" : "text-ink")}>
                <span className="font-medium">{n.what}</span>
                <span className="text-ink-subtle">
                  {" "}
                  · {EVIDENCE_SOURCES[n.source]}
                  {n.enough && ` · Enough: ${n.enough}`}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const RELATION = {
  supports: { label: "Supports", className: "bg-confirmed-50 text-confirmed-600" },
  contradicts: { label: "Contradicts", className: "bg-danger-50 text-danger-600" },
  neutral: { label: "Neutral", className: "bg-slate-100 text-slate-600" },
} as const;

function EvidenceSection({ v, live }: { v: ValidationRecord; live: LiveInvestigation }) {
  const { workspace } = useWorkspace();
  const { busy, error, run } = useAction();
  const settled = v.status === "settled";
  const [kind, setKind] = useState<"note" | "task" | "dataset">("note");
  const [relation, setRelation] = useState<"supports" | "contradicts">("supports");
  const [body, setBody] = useState("");
  const [taskId, setTaskId] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [needId, setNeedId] = useState("");
  const needLabel = (id?: string) => (id ? v.evidenceNeeded.find((n) => n.id === id)?.what : undefined);
  const tasks = live.record.researchTasks.filter((t) => t.outcome.trim() && !v.notes.some((n) => n.researchTaskId === t.id));
  const nameOf = (id: string) => workspace.evidence.find((e) => e.id === id)?.name ?? "A dataset";
  const count = v.notes.length + v.datasets.length;

  function add() {
    const reset = () => {
      setBody("");
      setTaskId("");
      setEvidenceId("");
      setNeedId("");
    };
    const need = needId || undefined;
    if (kind === "note") run("add", () => addValidationNote(v.id, { relation, body, needId: need }), reset);
    else if (kind === "task") run("add", () => addValidationNote(v.id, { relation, researchTaskId: taskId, needId: need }), reset);
    else run("add", () => addValidationDataset(v.id, { evidenceId, relation, shows: body, needId: need }), reset);
  }

  return (
    <section className="border-t border-line p-5">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Evidence collected ({count})</h4>
      {count === 0 && <p className="mt-1.5 text-[13px] text-ink-subtle">Nothing yet. Settling a hypothesis needs at least one piece of evidence.</p>}
      <ul className="mt-2 space-y-2">
        {v.notes.map((n) => (
          <li key={n.id} className="flex items-start gap-2 text-[13px]">
            <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-semibold", RELATION[n.relation].className)}>{RELATION[n.relation].label}</span>
            <span className="min-w-0 flex-1 text-ink">
              {n.byVeyra && <span className="text-brand-700">Veyra · </span>}
              {n.kind === "research-task" && <span className="text-ink-subtle">Research · </span>}
              {n.body}
              {needLabel(n.needId) && <span className="mt-0.5 block text-xs text-ink-subtle">For: {needLabel(n.needId)}</span>}
            </span>
            {!settled && (
              <button type="button" aria-label="Remove" onClick={() => run(n.id, () => removeValidationEvidence("note", n.id))} className="text-ink-faint hover:text-danger-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
        {v.datasets.map((d) => (
          <li key={d.id} className="flex items-start gap-2 text-[13px]">
            <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-semibold", RELATION[d.relation].className)}>{RELATION[d.relation].label}</span>
            <span className="min-w-0 flex-1 text-ink">
              <span className="text-ink-subtle">{nameOf(d.evidenceId)} · </span>
              {d.shows}
              {needLabel(d.needId) && <span className="mt-0.5 block text-xs text-ink-subtle">For: {needLabel(d.needId)}</span>}
            </span>
            {!settled && (
              <button type="button" aria-label="Remove" onClick={() => run(d.id, () => removeValidationEvidence("dataset", d.id))} className="text-ink-faint hover:text-danger-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {!settled && (
        <div className="mt-4 rounded-lg border border-line bg-canvas/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-muted">Add</span>
            {(
              [
                ["note", "A note"],
                ["task", "Research result"],
                ["dataset", "Data"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn("rounded-full border px-2.5 py-0.5 text-xs", kind === k ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink-muted")}
              >
                {label}
              </button>
            ))}
            <select value={relation} onChange={(e) => setRelation(e.target.value as typeof relation)} aria-label="Relation" className="ml-auto rounded-md border border-line bg-surface px-2 py-1 text-xs">
              <option value="supports">Supports it</option>
              <option value="contradicts">Contradicts it</option>
            </select>
          </div>
          <div className="mt-2 space-y-2">
            {kind === "task" &&
              (tasks.length ? (
                <select value={taskId} onChange={(e) => setTaskId(e.target.value)} aria-label="Research task" className={inputClass}>
                  <option value="">Choose a research task with a recorded result…</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-ink-subtle">No research results to add. Record what a task found in the Research tab first.</p>
              ))}
            {kind === "dataset" && (
              <select value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)} aria-label="Dataset" className={inputClass}>
                <option value="">Choose a dataset…</option>
                {workspace.evidence.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            )}
            {kind !== "task" && (
              <textarea
                className={textareaClass}
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={kind === "note" ? "What you found, e.g. 4 of 5 churned users said the new login confused them" : "What this data shows for the hypothesis, with its figures"}
                aria-label={kind === "note" ? "Note" : "What the data shows"}
              />
            )}
            {v.evidenceNeeded.length > 0 && (
              <select value={needId} onChange={(e) => setNeedId(e.target.value)} aria-label="Covers" className={inputClass}>
                <option value="">Which evidence needed does it cover? (optional)</option>
                {v.evidenceNeeded.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.what}
                  </option>
                ))}
              </select>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!!busy || (kind === "task" ? !taskId : kind === "dataset" ? !evidenceId || !body.trim() : !body.trim())}
              onClick={add}
            >
              {busy === "add" && <Spinner />} Add evidence
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger-600">
          {error}
        </p>
      )}
    </section>
  );
}

const OUTCOME_OPTIONS = [
  { value: "confirmed", label: "Confirmed", icon: Check },
  { value: "rejected", label: "Rejected", icon: X },
  { value: "unclear", label: "Unclear", icon: CircleHelp },
] as const;

function Settle({ v }: { v: ValidationRecord }) {
  const { busy, error, run } = useAction();
  const [outcome, setOutcome] = useState<"confirmed" | "rejected" | "unclear" | "">("");
  const [reason, setReason] = useState("");
  const [check, setCheck] = useState<CallCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  if (v.status === "settled") {
    return (
      <footer className="flex flex-col gap-3 border-t border-line bg-canvas/50 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-[13px]">
          <p className="font-semibold text-ink">
            {STATUS[v.outcome ?? "unclear"].label} by the team{v.settledAt ? ` ${formatRelative(v.settledAt).toLowerCase()}` : ""}.
          </p>
          <p className="mt-0.5 text-ink-muted">{v.reason}</p>
          {v.outcome === "confirmed" && <p className="mt-1 text-xs text-confirmed-600">Saved to Business Memory as a validated problem.</p>}
          {v.outcome === "rejected" && <p className="mt-1 text-xs text-ink-subtle">Ruled out and saved to Business Memory. Veyra won&rsquo;t suggest it again.</p>}
        </div>
        <Button type="button" size="sm" variant="secondary" disabled={!!busy} onClick={() => run("reopen", () => reopenValidation(v.id))}>
          {busy === "reopen" ? <Spinner /> : <RotateCcw className="h-3.5 w-3.5" />} Reopen
        </Button>
        {error && (
          <p role="alert" className="text-[13px] text-danger-600">
            {error}
          </p>
        )}
      </footer>
    );
  }

  const covered = coveredNeeds(v.evidenceNeeded, [...v.notes, ...v.datasets]);
  const missing = v.evidenceNeeded.filter((n) => !covered.has(n.id));

  async function askVeyra() {
    if (!outcome) return;
    setChecking(true);
    setCheckError(null);
    setCheck(null);
    const r = await checkCall(v.id, outcome, reason).catch(() => OFFLINE);
    if ("error" in r) setCheckError(r.error);
    else setCheck(r.check);
    setChecking(false);
  }

  return (
    <footer className="space-y-3 border-t border-line bg-canvas/50 px-5 py-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Your call</h4>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Outcome">
        {OUTCOME_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={outcome === o.value}
            onClick={() => setOutcome(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px]",
              outcome === o.value ? "border-brand-600 bg-brand-50 font-medium text-brand-700" : "border-line bg-surface text-ink-muted",
            )}
          >
            <o.icon className="h-3.5 w-3.5" /> {o.label}
          </button>
        ))}
      </div>
      <textarea className={textareaClass} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why? What in the evidence settles it" aria-label="Reason" />
      {missing.length > 0 && (
        <p className="rounded-lg bg-uncertain-50 px-3 py-2 text-[12.5px] text-uncertain-600">
          Not collected yet: {missing.map((n) => n.what).join("; ")}. You can still settle it, but the call rests on less than the plan asked for.
        </p>
      )}
      {check && (
        <div className={cn("rounded-lg px-3.5 py-2.5 text-[13px]", check.agrees === "agree" ? "bg-confirmed-50 text-confirmed-600" : "bg-uncertain-50 text-uncertain-600")}>
          <p className="font-semibold">
            {check.agrees === "agree" ? "Veyra agrees." : check.agrees === "partly" ? "Veyra partly agrees." : "Veyra disagrees."} The evidence points to{" "}
            {STATUS[check.suggestedOutcome].label.toLowerCase()}.
          </p>
          <p className="mt-0.5 text-ink">{check.reasoning}</p>
          {check.gaps.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-ink-muted">
              {check.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-xs text-ink-subtle">Advice only. You decide.</p>
        </div>
      )}
      {(error || checkError) && (
        <p role="alert" className="text-[13px] text-danger-600">
          {error ?? checkError}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={!outcome || checking || !!busy} onClick={askVeyra}>
          {checking ? <Spinner /> : <Sparkles className="h-3.5 w-3.5" />} {checking ? "Checking…" : "Ask Veyra to check my call"}
        </Button>
        <Button type="button" size="sm" disabled={!outcome || reason.trim().length < 3 || !!busy} onClick={() => outcome && run("settle", () => settleValidation(v.id, outcome, reason))}>
          {busy === "settle" && <Spinner />} Settle it
        </Button>
      </div>
    </footer>
  );
}
