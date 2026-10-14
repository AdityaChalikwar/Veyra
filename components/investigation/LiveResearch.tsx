"use client";

import { ChevronDown, CircleHelp, Compass, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateResearchTask } from "@/app/(app)/investigations/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { NextStep, OpenQuestion, ResearchTaskRecord } from "@/lib/types";

const methodLabel: Record<ResearchTaskRecord["method"], string> = {
  "data-analysis": "Data analysis",
  "customer-interviews": "Customer interviews",
  survey: "Survey",
  "feedback-analysis": "Feedback analysis",
  "usability-testing": "Usability testing",
  experiment: "Experiment",
  "desk-research": "Desk research",
};
const statusLabel: Record<ResearchTaskRecord["status"], string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
  dropped: "Dropped",
};
const priorityStyle = { high: "bg-danger-50 text-danger-600", medium: "bg-uncertain-50 text-uncertain-600", low: "bg-slate-100 text-slate-600" } as const;

export const approachLabel: Record<NonNullable<NextStep["approach"]>["step"], string> = {
  "establish-facts": "Establish the facts",
  "explain-change": "Explain the change",
  "fill-gaps": "Fill the gaps",
  "test-hypotheses": "Test the hypotheses",
};
export const sufficiencyLabel: Record<NonNullable<NextStep["approach"]>["evidenceSufficiency"], string> = {
  sufficient: "Evidence is enough to answer the problem",
  partial: "Evidence answers part of the problem",
  insufficient: "Evidence isn't enough to answer the problem",
};

/** The step Veyra chose for its latest analysis, and why. */
export function ApproachNote({ approach }: { approach: NonNullable<NextStep["approach"]> }) {
  return (
    <div className="flex gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <Compass className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <div className="min-w-0 text-[13px]">
        <p className="font-semibold text-ink">
          Veyra&rsquo;s approach: {approachLabel[approach.step]}
          <span
            className={cn(
              "ml-2 rounded px-1.5 py-0.5 text-[11px] font-medium",
              approach.evidenceSufficiency === "sufficient" ? "bg-confirmed-50 text-confirmed-600" : approach.evidenceSufficiency === "partial" ? "bg-brand-50 text-brand-700" : "bg-uncertain-50 text-uncertain-600",
            )}
          >
            {sufficiencyLabel[approach.evidenceSufficiency]}
          </span>
        </p>
        {approach.why && (
          <details className="mt-1">
            <summary className="cursor-pointer text-xs font-medium text-brand-600">Why this step</summary>
            <p className="mt-1 leading-relaxed text-ink-muted">{approach.why}</p>
          </details>
        )}
      </div>
    </div>
  );
}

/** Research Needed for the team's own investigation: tasks they work through, and the open questions behind them. */
export function LiveResearch({ tasks, questions, approach }: { tasks: ResearchTaskRecord[]; questions: OpenQuestion[]; approach?: NextStep["approach"] }) {
  const order = { "in-progress": 0, "not-started": 1, done: 2, dropped: 3 } as const;
  const rank = { high: 0, medium: 1, low: 2 } as const;
  const active = tasks.filter((t) => t.status !== "dropped").sort((a, b) => order[a.status] - order[b.status] || rank[a.priority] - rank[b.priority]);
  const dropped = tasks.filter((t) => t.status === "dropped");

  return (
    <div className="mt-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Research Needed</h2>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-subtle">
          What Veyra can&rsquo;t answer from the data yet, and how to find out. Record what you find on each task; the next analysis uses it.
        </p>
      </div>
      {approach && <ApproachNote approach={approach} />}

      <section>
        <h3 className="text-[15px] font-semibold">Research tasks</h3>
        {active.length ? (
          <ol className="mt-3 space-y-3">
            {active.map((t) => (
              <li key={t.id}>
                <TaskCard task={t} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-[13px] text-ink-faint">No research tasks yet. Analyse your data and Veyra suggests what to find out next.</p>
        )}
        {dropped.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-ink-subtle">Dropped ({dropped.length})</summary>
            <ul className="mt-2 space-y-2">
              {dropped.map((t) => (
                <li key={t.id}>
                  <TaskCard task={t} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section>
        <h3 className="text-[15px] font-semibold">Open questions</h3>
        <p className="text-xs text-ink-subtle">Important things Veyra doesn&rsquo;t know yet, from the latest analysis.</p>
        {questions.length ? (
          <ul className="mt-3 space-y-2">
            {questions.map((q) => (
              <li key={q.id} className="rounded-lg border border-dashed border-line-strong bg-surface px-4 py-3">
                <p className="flex gap-2 text-[13.5px] font-medium text-ink">
                  <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                  {q.question}
                </p>
                <dl className="mt-1.5 space-y-1 pl-6 text-[13px]">
                  <div>
                    <dt className="inline text-ink-subtle">Why it matters: </dt>
                    <dd className="inline text-ink-muted">{q.whyItMatters}</dd>
                  </div>
                  {q.missingEvidence && (
                    <div>
                      <dt className="inline text-ink-subtle">Missing evidence: </dt>
                      <dd className="inline text-ink-muted">{q.missingEvidence}</dd>
                    </div>
                  )}
                  {q.researchTaskId && (
                    <div>
                      <dt className="inline text-ink-subtle">Answered by: </dt>
                      <dd className="inline text-ink-muted">{tasks.find((t) => t.id === q.researchTaskId)?.title}</dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-ink-faint">No open questions right now.</p>
        )}
      </section>
    </div>
  );
}

function TaskCard({ task: t }: { task: ResearchTaskRecord }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(t.status);
  const [outcome, setOutcome] = useState(t.outcome);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await updateResearchTask(t.id, { status, outcome });
      if ("error" in r) setError(r.error);
      else {
        setEditing(false);
        router.refresh();
      }
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <article className={cn("rounded-xl border bg-surface p-5 shadow-card", t.status === "done" ? "border-confirmed-200" : "border-line", t.status === "dropped" && "opacity-70")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-[14.5px] font-semibold leading-snug">{t.title}</h4>
        <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium capitalize", priorityStyle[t.priority])}>{t.priority} priority</span>
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-[13px] text-ink-muted">
        <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
        <span>
          <span className="text-ink-subtle">Answers:</span> {t.question}
        </span>
      </p>
      <p className="mt-2 flex items-start gap-1.5 text-[13px] text-ink">
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
        <span>
          <span className="font-medium">{methodLabel[t.method]}</span>
          {t.methodDetail && ` — ${t.methodDetail}`}
        </span>
      </p>
      {t.rationale && <p className="mt-1.5 text-xs text-ink-subtle">Why: {t.rationale}</p>}
      {t.hypothesisRefs.length > 0 && <p className="mt-1 text-xs text-ink-subtle">Tests {t.hypothesisRefs.join(", ")} from the analysis it came from.</p>}

      {editing ? (
        <div className="mt-4 space-y-3 rounded-lg bg-canvas p-3">
          <label className="block text-xs font-medium text-ink-muted">
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as ResearchTaskRecord["status"])} className="mt-1 block w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]">
              {Object.entries(statusLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-ink-muted">
            What you found
            <textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="e.g. 6 of 8 customers we called said the plates chipped within a month."
              className="mt-1 block w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-danger-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={save} disabled={saving}>
              {saving && <Spinner />} Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => (setEditing(false), setStatus(t.status), setOutcome(t.outcome))}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-xs text-ink-muted">
            Status: <span className="font-medium text-ink">{statusLabel[t.status]}</span>
          </span>
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
            Update progress <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {t.outcome && <p className="w-full rounded-lg bg-confirmed-50 px-3 py-2 text-[13px] text-ink">Found: {t.outcome}</p>}
        </div>
      )}
    </article>
  );
}
