import type { EvidenceNeed } from "@/lib/analysis/evidence-needs";
import type { TestOutcome, TestSpec } from "./tests";

/** A validation run as stored in `validation_runs`, shared by the engine and the screens. */

export type RunPhase = "planning" | "gathering" | "needs-input" | "testing" | "judging" | "settling" | "follow-through" | "completed" | "failed";

export const ACTIVE_PHASES: RunPhase[] = ["planning", "gathering", "testing", "judging", "settling", "follow-through"];

export type RunStep = { at: string; label: string; detail?: string; state: "done" | "warn" };

/** Evidence Veyra couldn't reach: the team can add it or go ahead without it. */
export type RunRequest = {
  id: string;
  needId: string;
  what: string;
  why: string;
  how: string;
  impact: "high" | "medium" | "low";
  answer: "upload" | "text" | "source";
  status: "open" | "provided" | "skipped";
  answerText?: string;
};

export type DesignedTest = TestSpec & { id: string; needId: string; evidenceId: string; dataset: string; why: string; done?: boolean };
export type DesignedText = { id: string; needId: string; evidenceId: string; dataset: string; textColumn: string; question: string; labels: string[]; done?: boolean };

export type RunDesign = {
  /** The plan as it was when the run started: fixed before any result. */
  plan: { method: string; test: string; confirmIf: string; rejectIf: string; needs: EvidenceNeed[] };
  tests: DesignedTest[];
  texts: DesignedText[];
  web: { needId: string; query: string }[];
  webDone?: boolean;
  /** Synced datasets Veyra added to the investigation for this run. */
  added: string[];
};

export type RunResult =
  | { id: string; kind: "data"; needId: string; evidenceId: string; dataset: string; why: string; spec: TestSpec; outcome: TestOutcome }
  | {
      id: string;
      kind: "text";
      needId: string;
      evidenceId: string;
      dataset: string;
      question: string;
      counts: { label: string; count: number }[];
      read: number;
      total: number;
      examples: string[];
    }
  | { id: string; kind: "web"; needId: string; finding: string; sources: { url: string; title: string }[] }
  | { id: string; kind: "answer"; needId: string; what: string; text: string }
  | { id: string; kind: "skipped"; needId: string; what: string; reason: string };

export type RunVerdict = {
  outcome: "confirmed" | "rejected" | "unclear";
  confidence: "low" | "medium" | "high";
  reasoning: string;
  challenges: string[];
  holds: "holds" | "weaker" | "overturned";
  strengthen: string[];
  assessments: { id: string; relation: "supports" | "contradicts" | "neutral"; why: string }[];
  /** Limits applied in code, e.g. "Capped at medium: no data test ran." */
  capped: string[];
};

export type FollowThrough = Partial<Record<"problem" | "opportunities" | "brief", "todo" | "done" | "skipped" | string>>;

export type ValidationRunRecord = {
  id: string;
  validationId: string;
  phase: RunPhase;
  steps: RunStep[];
  design?: RunDesign;
  requests: RunRequest[];
  results: RunResult[];
  verdict?: RunVerdict;
  followThrough: FollowThrough;
  proceedWithout: boolean;
  error?: string;
  leaseUntil?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

/** A one-line description of a result, as the judge and the screens show it. */
export function describeResult(r: RunResult): string {
  switch (r.kind) {
    case "data":
      return r.outcome.ok ? `${r.outcome.title}. ${r.outcome.summary} (${r.outcome.sample})` : `${r.outcome.title}: couldn't run — ${r.outcome.reason}`;
    case "text":
      return `${r.question} — in ${r.read} of ${r.total} texts read from ${r.dataset}: ${r.counts.map((c) => `${c.label} ${c.count}`).join(", ")}.${r.examples.length ? ` Examples: ${r.examples.map((e) => `“${e}”`).join(" ")}` : ""}`;
    case "web":
      return `${r.finding} (Sources: ${r.sources.map((s) => s.title || s.url).join("; ")})`;
    case "answer":
      return `The team answered “${r.what}”: ${r.text}`;
    case "skipped":
      return `Not available: ${r.what} — ${r.reason}`;
  }
}
