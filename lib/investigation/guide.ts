import { ACTIVE_PHASES } from "@/lib/validation-run/types";
import type { DiscoveryStage, Hypothesis, InvestigationWorkspace, LiveInvestigation } from "@/lib/types";

/**
 * Where a live investigation stands and the one thing that moves it forward,
 * worked out in code from its records. Also the stopping rule: when the team
 * knows enough to decide.
 */

type Live = InvestigationWorkspace & { live: LiveInvestigation };

const RANK: Record<string, number> = { high: 3, "medium-high": 2.5, medium: 2, "low-medium": 1.5, low: 1 };

const isRunning = (live: LiveInvestigation, h: Hypothesis) => {
  const run = live.record.validations.find((x) => x.id === h.validationId)?.run;
  return !!run && (ACTIVE_PHASES.includes(run.phase) || run.phase === "needs-input");
};

/** The hypothesis worth validating next: what opportunities depend on first, then the most likely. */
export function suggestNext(hypotheses: Hypothesis[], live: LiveInvestigation): string | undefined {
  const depended = new Set(live.record.opportunities.flatMap((o) => o.dependsOn));
  const score = (h: Hypothesis) => (depended.has(h.id) ? 10 : 0) + (RANK[h.confidence] ?? 0);
  return hypotheses
    .filter((h) => h.status !== "confirmed" && h.status !== "rejected" && !isRunning(live, h))
    .sort((a, b) => score(b) - score(a))[0]?.id;
}

export type Readiness = { ready: boolean; reason: string };

/**
 * Enough to decide when a cause is confirmed or likely, or when nothing likely
 * is left to test (every hypothesis still open is low confidence).
 */
export function readiness(ws: Live): Readiness {
  const hs = ws.hypotheses;
  const confirmed = hs.filter((h) => h.status === "confirmed");
  if (confirmed.length) return { ready: true, reason: `${confirmed.map((h) => h.label).join(", ")} ${confirmed.length === 1 ? "is" : "are"} confirmed, so the cause is known.` };
  const supported = hs.filter((h) => h.status === "likely");
  if (supported.length) return { ready: true, reason: `${supported.map((h) => h.label).join(", ")} ${supported.length === 1 ? "is" : "are"} the likely cause: the tests support it, though not everything is ruled out.` };
  if (!hs.length) return { ready: false, reason: "There are no hypotheses to test yet." };
  const untested = hs.filter((h) => !h.status || h.status === "open");
  const plausible = untested.filter((h) => (RANK[h.confidence] ?? 0) >= 2);
  if (!plausible.length) {
    return {
      ready: true,
      reason: untested.length
        ? "The likely causes have been tested. What is left is low confidence and unlikely to change the decision."
        : "Every hypothesis has been tested.",
    };
  }
  return { ready: false, reason: `${plausible.length === 1 ? "A plausible cause hasn't" : `${plausible.length} plausible causes haven't`} been tested yet.` };
}

export type NextAction = {
  tone: "next" | "ready" | "working" | "done";
  label: string;
  text: string;
  cta: string;
  tab: string;
  /** A second way forward, e.g. deciding before the evidence is complete. */
  alt?: { cta: string; tab: string };
};

export function nextAction(ws: Live): NextAction {
  const r = ws.live.record;
  const run = ws.live.run;
  if (ws.investigation.status === "completed" && r.decisions.length) {
    const d = r.decisions[0];
    return d.result
      ? { tone: "done", label: "Completed.", text: `Decided: ${d.summary}. The outcome is in Business Memory.`, cta: "View the decision", tab: "report" }
      : { tone: "done", label: "Completed.", text: `Decided: ${d.summary}. When you know how it turned out, add what happened so future investigations learn from it.`, cta: "Add what happened", tab: "report" };
  }
  if (!ws.evidence.length) return { tone: "next", label: "Next:", text: "Add data: take datasets from a connected source like the Demo ERP, or upload a CSV export.", cta: "Add data", tab: "evidence" };
  if (!run) return { tone: "next", label: "Next:", text: "Analyse your data. Veyra turns it into findings and hypotheses about the cause.", cta: "Go to Evidence", tab: "evidence" };

  const running = ws.hypotheses.find((h) => isRunning(ws.live, h));
  if (running) {
    const v = r.validations.find((x) => x.id === running.validationId);
    return v?.run?.phase === "needs-input"
      ? { tone: "next", label: "Veyra needs you:", text: `It can't reach some evidence for ${running.label}. Add it, or tell it to go ahead without it.`, cta: "Go to Validation", tab: "validation" }
      : { tone: "working", label: "Working:", text: `Veyra is validating ${running.label}. It takes a few minutes and carries on if you leave.`, cta: "Watch it", tab: "validation" };
  }

  const ready = readiness(ws);
  if (ready.ready) {
    const lastSettled = r.validations.map((v) => v.settledAt ?? "").sort().at(-1) ?? "";
    const confirmed = ws.hypotheses.some((h) => h.status === "confirmed");
    const likely = ws.hypotheses.some((h) => h.status === "likely");
    const cause = r.problemDefinition?.causeStatus ?? "open";
    if ((confirmed && cause !== "validated") || (likely && cause === "open")) {
      return { tone: "ready", label: "Almost there:", text: `A cause is ${confirmed ? "confirmed" : "likely"}. Define the problem again so it names the cause.`, cta: "Define again", tab: "problem" };
    }
    if (!r.brief || r.brief.createdAt < lastSettled) {
      return { tone: "ready", label: "Ready to decide.", text: `${ready.reason} Write the Decision Brief: Veyra sums up what is known and recommends what to do.`, cta: r.brief ? "Update the brief" : "Write the brief", tab: "report" };
    }
    return { tone: "ready", label: "Ready to decide.", text: "Read the Decision Brief and record the team's decision. That completes the investigation.", cta: "Record the decision", tab: "report" };
  }

  const next = ws.hypotheses.find((h) => h.id === suggestNext(ws.hypotheses, ws.live));
  return {
    tone: "next",
    label: "Next:",
    text: next
      ? `Validate ${next.label} (${next.title || "the most likely cause"}). Veyra tests it with your data and settles it. ${ready.reason}`
      : ready.reason,
    cta: "Go to Validation",
    tab: "validation",
    alt: { cta: "Decide anyway", tab: "report" },
  };
}

/** The stored discovery stages, plus the decision that ends the investigation. */
export function withDecision(stages: DiscoveryStage[], ws: Live): DiscoveryStage[] {
  const decided = ws.investigation.status === "completed";
  const ready = !decided && readiness(ws).ready;
  return [
    ...stages.map((s) => (decided && s.status !== "done" ? { ...s, status: "done" as const } : ready && s.status === "in-progress" ? { ...s, status: "done" as const } : s)),
    { id: "decision", label: "Decision", status: decided ? "done" : ready ? "in-progress" : "pending" },
  ];
}
