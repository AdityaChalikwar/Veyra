"use client";

import { Check, CircleCheck, CircleX, Gauge, Inbox, Play, ShieldX, Target, TestTube2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/time";
import type { ValidationPlan } from "@/lib/types";
import { ComingNext } from "./ComingNext";
import { useWorkspace } from "./workspace-context";

const statusStyle = {
  "not-started": { label: "Not started", className: "bg-slate-100 text-slate-600" },
  running: { label: "In progress", className: "bg-brand-50 text-brand-700" },
  results: { label: "Results in", className: "bg-uncertain-50 text-uncertain-600" },
  confirmed: { label: "Confirmed", className: "bg-confirmed-50 text-confirmed-600" },
  rejected: { label: "Rejected", className: "bg-slate-100 text-slate-600" },
} as const;

function statusKey(v: ValidationPlan): keyof typeof statusStyle {
  if (v.status === "completed") return v.outcome ?? "confirmed";
  if (v.status === "running" && v.result) return "results";
  return v.status;
}

/** For each important hypothesis: what we believe, what would disprove it, and the test that would settle it. */
export function ValidationView() {
  const { workspace } = useWorkspace();
  if (workspace.live) {
    const tests = workspace.hypotheses.filter((h) => h.validationMethod);
    return (
      <ComingNext title="Validation tracking comes next">
        <p>Soon you&rsquo;ll start, track and record the result of each test here. Confirming a hypothesis validates the problem.</p>
        {tests.length ? (
          <>
            <p>Tests Veyra suggested from your data:</p>
            <ul className="space-y-2">
              {tests.map((h) => (
                <li key={h.id} className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
                  <p className="text-[13.5px] font-medium text-ink">
                    {h.label}: {h.statement}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    <span className="font-medium text-ink">Test:</span> {h.validationMethod}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Hypotheses to test appear once your data has been analysed.</p>
        )}
      </ComingNext>
    );
  }
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold">Validation</h2>
      <p className="mt-1 max-w-2xl text-[13px] text-ink-subtle">
        A hypothesis becomes something the team can act on only once it survives a test designed to disprove it.
      </p>
      <div className="mt-5 space-y-4">
        {workspace.validations.map((v) => (
          <ValidationCard key={v.id} plan={v} />
        ))}
      </div>
    </div>
  );
}

function ValidationCard({ plan: v }: { plan: ValidationPlan }) {
  const { workspace, startValidation, openDetail, running, fetchValidationResult, recordValidationOutcome } = useWorkspace();
  const h = workspace.hypotheses.find((x) => x.id === v.hypothesisId);
  const s = statusStyle[statusKey(v)];
  const label = h?.label ?? "the hypothesis";

  return (
    <article className="rounded-xl border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {h && (
              <button
                type="button"
                onClick={() => openDetail({ type: "hypothesis", id: h.id })}
                className="rounded-md border border-dashed border-uncertain-600/50 px-1.5 text-[13px] font-semibold text-uncertain-600 hover:bg-uncertain-50"
              >
                {h.label}
              </button>
            )}
            <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", s.className)}>{s.label}</span>
            {h && <ConfidenceBadge level={h.confidence} />}
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">What do we believe?</p>
          <p className="text-[15px] font-semibold leading-snug">{v.belief}</p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <Item icon={Target} label="What evidence supports it?">
          {v.supportedBy.length ? (
            <ul className="list-disc space-y-0.5 pl-4">
              {v.supportedBy.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : (
            <span className="text-ink-faint">No supporting evidence yet.</span>
          )}
        </Item>
        <Item icon={ShieldX} label="What would disprove it?">
          {v.wouldDisprove}
        </Item>
        <Item icon={TestTube2} label="What test would increase confidence?">
          {v.test}
          <span className="mt-1 block text-ink-subtle">
            <span className="font-medium text-ink-muted">Success signal:</span> {v.successSignal}
          </span>
        </Item>
        <Item icon={Gauge} label="What metric would change if we're right?">
          {v.metric}
        </Item>
      </dl>

      {v.result && (
        <div className="border-t border-line p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            <Inbox className="h-3.5 w-3.5" /> Results
          </p>
          <p className="mt-1 text-[14.5px] font-semibold leading-snug">{v.result.summary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-ink-muted">
            {v.result.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p
            className={cn(
              "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-[13px]",
              v.result.signalMet ? "bg-confirmed-50 text-confirmed-600" : "bg-slate-100 text-slate-600",
            )}
          >
            {v.result.signalMet ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>
              <b className="font-semibold">{v.result.signalMet ? "Success signal met." : "Success signal not met."}</b> {v.result.signal}
            </span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-line bg-canvas/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-muted">
          {v.status === "completed"
            ? `${v.outcome === "confirmed" ? "Confirmed" : "Rejected"} by the team ${formatRelative(v.completedAt ?? "").toLowerCase()}.${
                v.outcome === "confirmed" ? " The problem is validated." : ""
              }`
            : v.result
              ? `Veyra suggests the results ${v.result.suggestedOutcome === "confirmed" ? "confirm" : "reject"} ${label}. You decide.`
              : v.status === "running" && v.startedAt
                ? `Started ${formatRelative(v.startedAt).toLowerCase()}. Preview: results are simulated — collect them when you're ready.`
                : "Starting a validation records the plan and tracks it until results come in."}
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          {v.status === "not-started" && (
            <Button type="button" size="sm" onClick={() => startValidation(v.id)}>
              <Play className="h-3.5 w-3.5" /> Start Validation
            </Button>
          )}
          {v.status === "running" && !v.result && (
            <Button type="button" size="sm" onClick={() => fetchValidationResult(v.id)} disabled={running[v.id]}>
              {running[v.id] ? <Spinner /> : <Inbox className="h-3.5 w-3.5" />} {running[v.id] ? "Collecting results…" : "Get results"}
            </Button>
          )}
          {v.status === "running" && v.result && (
            <>
              <Button
                type="button"
                size="sm"
                variant={v.result.suggestedOutcome === "rejected" ? "primary" : "secondary"}
                onClick={() => recordValidationOutcome(v.id, "rejected")}
              >
                <X className="h-3.5 w-3.5" /> Reject {label}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={v.result.suggestedOutcome === "confirmed" ? "primary" : "secondary"}
                onClick={() => recordValidationOutcome(v.id, "confirmed")}
              >
                <Check className="h-3.5 w-3.5" /> Confirm {label}
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function Item({ icon: Icon, label, children }: { icon: typeof Target; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
        <dd className="mt-0.5 text-[13.5px] leading-relaxed text-ink">{children}</dd>
      </div>
    </div>
  );
}
