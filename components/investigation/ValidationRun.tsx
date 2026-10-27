"use client";

import { ArrowRight, Check, CircleAlert, ExternalLink, FileUp, Link2, Loader2, MessageSquareText, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addHeldBackDemoFile } from "@/app/(app)/investigations/demo-actions";
import { answerRequest, continueRun, rerunWithEvidence } from "@/app/(app)/investigations/run-actions";
import { Button } from "@/components/ui/Button";
import { textareaClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import { ACTIVE_PHASES, type RunPhase, type RunRequest, type RunResult, type ValidationRunRecord } from "@/lib/validation-run/types";
import { useWorkspace } from "./workspace-context";

const OFFLINE = { error: "Couldn't reach Veyra. Check your connection and try again." };

const PHASE_LABEL: Record<RunPhase, string> = {
  planning: "Planning the test",
  gathering: "Finding the evidence it needs",
  "needs-input": "Waiting for you",
  testing: "Running the tests",
  judging: "Judging the result and challenging it",
  settling: "Settling the hypothesis",
  "follow-through": "Updating the problem, opportunities and brief",
  completed: "Done",
  failed: "Stopped",
};

const OUTCOME = {
  confirmed: { label: "Confirmed", className: "bg-confirmed-50 text-confirmed-600 border-confirmed-200" },
  rejected: { label: "Rejected", className: "bg-slate-100 text-slate-700 border-line" },
  unclear: { label: "Unclear", className: "bg-uncertain-50 text-uncertain-600 border-uncertain-200" },
} as const;

/** What Veyra is doing, or did, to validate one hypothesis. */
export function RunPanel({ run, onRunAgain, busyAgain }: { run: ValidationRunRecord; onRunAgain: () => void; busyAgain: boolean }) {
  const active = ACTIVE_PHASES.includes(run.phase);
  return (
    <section className="border-t border-line">
      {active && <Progress run={run} />}
      {run.phase === "needs-input" && <Requests run={run} />}
      {run.phase === "failed" && (
        <div className="flex flex-col gap-3 bg-danger-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[13px] text-danger-600">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {run.error ?? "The validation stopped."}
          </p>
          <Button type="button" size="sm" variant="secondary" disabled={busyAgain} onClick={onRunAgain}>
            {busyAgain ? <Spinner /> : <RotateCcw className="h-3.5 w-3.5" />} Run again
          </Button>
        </div>
      )}
      {run.phase === "completed" && <Verdict run={run} onRunAgain={onRunAgain} busyAgain={busyAgain} />}
    </section>
  );
}

function Progress({ run }: { run: ValidationRunRecord }) {
  return (
    <div className="bg-brand-50/40 px-5 py-4">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-brand-700">
        <Loader2 className="h-4 w-4 animate-spin" /> Veyra is validating this · {PHASE_LABEL[run.phase]}
      </p>
      <p className="mt-0.5 text-xs text-ink-subtle">This takes a few minutes. You can leave this page; it carries on.</p>
      <Steps run={run} />
    </div>
  );
}

function Steps({ run, collapsed }: { run: ValidationRunRecord; collapsed?: boolean }) {
  const [open, setOpen] = useState(!collapsed);
  if (!run.steps.length) return null;
  return (
    <div className="mt-3">
      {collapsed && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs font-medium text-brand-600 hover:text-brand-700" aria-expanded={open}>
          {open ? "Hide what Veyra did" : `What Veyra did (${run.steps.length} steps)`}
        </button>
      )}
      {open && (
        <ol className="mt-2 space-y-1.5">
          {run.steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-[12.5px]">
              {s.state === "warn" ? <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-uncertain-600" /> : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-confirmed-600" />}
              <span className="min-w-0">
                <span className="font-medium text-ink">{s.label}</span>
                {s.detail && <span className="text-ink-subtle"> — {s.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const IMPACT = { high: "Would change the verdict most", medium: "Would strengthen it", low: "Nice to have" } as const;

/** Evidence Veyra couldn't reach: add it, or go ahead without it. */
function Requests({ run }: { run: ValidationRunRecord }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const provided = run.requests.filter((r) => r.status === "provided").length;
  async function go() {
    setBusy(true);
    setError(null);
    const r = await continueRun(run.id).catch(() => OFFLINE);
    if ("error" in r) setError(r.error);
    else router.refresh();
    setBusy(false);
  }
  return (
    <div className="bg-uncertain-50/40 px-5 py-4">
      <p className="text-[13.5px] font-semibold text-ink">To make this verdict stronger, Veyra needs:</p>
      <p className="mt-0.5 text-xs text-ink-subtle">Add what you can. Or go ahead without it: Veyra will use what it has and say how sure it can be.</p>
      <ol className="mt-3 space-y-3">
        {run.requests.map((r, i) => (
          <RequestItem key={r.id} runId={run.id} r={r} n={i + 1} />
        ))}
      </ol>
      {error && <p className="mt-2 text-[13px] text-danger-600">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {provided > 0 && (
          <Button type="button" size="sm" disabled={busy} onClick={go}>
            {busy ? <Spinner /> : <ArrowRight className="h-3.5 w-3.5" />} Add {provided === 1 ? "it" : "them"} and run
          </Button>
        )}
        <Button type="button" size="sm" variant={provided ? "ghost" : "primary"} disabled={busy} onClick={go}>
          {busy && !provided ? <Spinner /> : null} {provided ? "Go ahead with what's added" : "Go ahead without it"}
        </Button>
      </div>
    </div>
  );
}

function RequestItem({ runId, r, n }: { runId: string; r: RunRequest; n: number }) {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const [text, setText] = useState(r.answerText ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = r.status === "provided";
  async function save(answer: { text?: string; added?: boolean }) {
    setBusy(true);
    setError(null);
    const res = await answerRequest(runId, r.id, answer).catch(() => OFFLINE);
    if ("error" in res) setError(res.error);
    else router.refresh();
    setBusy(false);
  }
  async function addDemo() {
    setBusy(true);
    setError(null);
    const res = await addHeldBackDemoFile(runId, r.id).catch(() => OFFLINE);
    if ("error" in res) setError(res.error);
    else router.refresh();
    setBusy(false);
  }
  const Icon = r.answer === "upload" ? FileUp : r.answer === "source" ? Link2 : MessageSquareText;
  return (
    <li className={cn("rounded-lg border bg-surface p-3", done ? "border-confirmed-200" : "border-line")}>
      <div className="flex items-start gap-2">
        <span className="mt-px text-[13px] font-semibold text-ink-subtle">{n}.</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-ink">
            {r.what}
            {done && <span className="ml-2 rounded bg-confirmed-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-confirmed-600">Added</span>}
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">{r.why}</p>
          <p className="mt-1 flex items-start gap-1.5 text-[12.5px] text-ink-subtle">
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-medium text-ink-muted">Where to find it:</span> {r.how}
            </span>
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-ink-faint">{IMPACT[r.impact]}</p>
          {!done &&
            (r.answer === "text" ? (
              <div className="mt-2 space-y-2">
                <textarea className={textareaClass} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer, in a few words" aria-label={`Answer to: ${r.what}`} />
                <Button type="button" size="sm" variant="secondary" disabled={busy || !text.trim()} onClick={() => save({ text })}>
                  {busy && <Spinner />} Save answer
                </Button>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* The full demo keeps its crash export back for exactly this moment. */}
                {workspace.investigation.demoScenario && r.answer === "upload" && /crash|stabil|anr|vital|login|sign-?in/i.test(`${r.what} ${r.how}`) && (
                  <Button type="button" size="sm" disabled={busy} onClick={() => addDemo()}>
                    {busy ? <Spinner /> : <FileUp className="h-3.5 w-3.5" />} Add the demo&rsquo;s crash export
                  </Button>
                )}
                <Link
                  href={r.answer === "upload" ? routes.investigation(workspace.investigation.id, "evidence") : routes.dataSources}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
                >
                  {r.answer === "upload" ? "Upload it in the Evidence tab" : "Connect it in Data Sources"} <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => save({ added: true })}>
                  {busy && <Spinner />} I&rsquo;ve added it
                </Button>
              </div>
            ))}
          {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
        </div>
      </div>
    </li>
  );
}

/** Veyra's verdict, what it rests on, and how to make it stronger. */
function Verdict({ run, onRunAgain, busyAgain }: { run: ValidationRunRecord; onRunAgain: () => void; busyAgain: boolean }) {
  const v = run.verdict;
  if (!v) return null;
  const o = OUTCOME[v.outcome];
  const relation = (id: string) => v.assessments.find((a) => a.id === id);
  const shown = run.results.filter((r) => r.kind !== "skipped");
  const skipped = run.requests.filter((r) => r.status === "skipped");
  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-md border px-2 py-0.5 text-[12px] font-semibold", o.className)}>{o.label} by Veyra</span>
        <span className="text-xs text-ink-subtle">
          {v.confidence} confidence · {run.completedAt ? formatRelative(run.completedAt).toLowerCase() : "just now"}
        </span>
        {v.holds !== "holds" && (
          <span className="rounded bg-uncertain-50 px-1.5 py-0.5 text-[11px] font-medium text-uncertain-600">{v.holds === "weaker" ? "Weakened when challenged" : "Changed when challenged"}</span>
        )}
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{v.reasoning}</p>
      {v.capped.length > 0 && <p className="mt-1 text-xs text-ink-subtle">{v.capped.join(" ")}</p>}

      {v.challenges.length > 0 && (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            <ShieldCheck className="h-3.5 w-3.5" /> What Veyra checked against it
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12.5px] text-ink-muted">
            {v.challenges.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {shown.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">The evidence</p>
          <ul className="mt-2 space-y-2">
            {shown.map((r) => (
              <ResultItem key={r.id} r={r} assessment={relation(r.id)} />
            ))}
          </ul>
        </div>
      )}

      <Steps run={run} collapsed />

      {(v.strengthen.length > 0 || skipped.length > 0) && (
        <MakeStronger run={run} strengthen={v.strengthen} skipped={skipped} onRunAgain={onRunAgain} busyAgain={busyAgain} />
      )}
      {!v.strengthen.length && !skipped.length && (
        <div className="mt-4">
          <Button type="button" size="sm" variant="ghost" disabled={busyAgain} onClick={onRunAgain}>
            {busyAgain ? <Spinner /> : <RotateCcw className="h-3.5 w-3.5" />} Run again
          </Button>
        </div>
      )}
    </div>
  );
}

const REL = {
  supports: { label: "Supports", className: "bg-confirmed-50 text-confirmed-600" },
  contradicts: { label: "Contradicts", className: "bg-danger-50 text-danger-600" },
  neutral: { label: "Neutral", className: "bg-slate-100 text-slate-600" },
} as const;

function ResultItem({ r, assessment }: { r: RunResult; assessment?: { relation: "supports" | "contradicts" | "neutral"; why: string } }) {
  const failed = r.kind === "data" && !r.outcome.ok;
  const rel = failed ? { label: "Not run", className: "bg-slate-100 text-slate-500" } : REL[assessment?.relation ?? "neutral"];
  return (
    <li className="rounded-lg border border-line bg-canvas/40 p-3 text-[13px]">
      <div className="flex items-start gap-2">
        <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-semibold", rel.className)}>{rel.label}</span>
        <div className="min-w-0 flex-1">
          {r.kind === "data" && (
            <>
              <p className="font-medium text-ink">{r.outcome.title}</p>
              {r.outcome.ok ? (
                <>
                  <p className="mt-0.5 text-ink-muted">{r.outcome.summary}</p>
                  <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {r.outcome.figures.slice(0, 6).map((f) => (
                      <div key={f.label}>
                        <dt className="inline text-ink-subtle">{f.label}: </dt>
                        <dd className="inline font-medium text-ink">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-1 text-[11.5px] text-ink-faint">
                    Calculated from {r.dataset} · {r.outcome.sample}
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-ink-subtle">Couldn&rsquo;t run: {r.outcome.reason}</p>
              )}
            </>
          )}
          {r.kind === "text" && (
            <>
              <p className="font-medium text-ink">{r.question}</p>
              <p className="mt-0.5 text-ink-muted">
                Read {r.read} of {r.total} in {r.dataset}: {r.counts.map((c) => `${c.label} ${c.count}`).join(" · ")}
              </p>
              {r.examples.map((e) => (
                <p key={e} className="mt-1 border-l-2 border-line pl-2 text-xs italic text-ink-subtle">
                  &ldquo;{e}&rdquo;
                </p>
              ))}
            </>
          )}
          {r.kind === "web" && (
            <>
              <p className="text-ink">{r.finding}</p>
              <ul className="mt-1 space-y-0.5">
                {r.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                      {s.title || s.url} <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          {r.kind === "answer" && (
            <p className="text-ink">
              <span className="text-ink-subtle">Your answer to “{r.what}”: </span>
              {r.text}
            </p>
          )}
          {assessment?.why && <p className="mt-1 text-xs text-ink-subtle">Why: {assessment.why}</p>}
        </div>
      </div>
    </li>
  );
}

function MakeStronger({
  run,
  strengthen,
  skipped,
  onRunAgain,
  busyAgain,
}: {
  run: ValidationRunRecord;
  strengthen: string[];
  skipped: RunRequest[];
  onRunAgain: () => void;
  busyAgain: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const others = strengthen.filter((s) => !skipped.some((r) => r.what === s));
  async function rerun() {
    setBusy(true);
    setError(null);
    const r = await rerunWithEvidence(run.id).catch(() => OFFLINE);
    if ("error" in r) setError(r.error);
    else router.refresh();
    setBusy(false);
  }
  return (
    <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50/40 p-4">
      <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-700">
        <Sparkles className="h-4 w-4" /> Make this stronger
      </p>
      <p className="mt-0.5 text-xs text-ink-subtle">Add any of these and Veyra runs the validation again. The verdict and its confidence update.</p>
      {skipped.length > 0 && (
        <ol className="mt-3 space-y-3">
          {skipped.map((r, i) => (
            <RequestItem key={r.id} runId={run.id} r={{ ...r, status: "open" }} n={i + 1} />
          ))}
        </ol>
      )}
      {others.length > 0 && (
        <ul className="mt-3 list-disc space-y-0.5 pl-5 text-[12.5px] text-ink-muted">
          {others.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-[13px] text-danger-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {run.requests.some((r) => r.status === "provided" && !run.results.some((x) => x.id === r.id)) && (
          <Button type="button" size="sm" disabled={busy} onClick={rerun}>
            {busy ? <Spinner /> : <ArrowRight className="h-3.5 w-3.5" />} Run again with this
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" disabled={busyAgain || busy} onClick={onRunAgain}>
          {busyAgain ? <Spinner /> : <RotateCcw className="h-3.5 w-3.5" />} Run again
        </Button>
      </div>
    </div>
  );
}
