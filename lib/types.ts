import type { ValidationRunRecord } from "@/lib/validation-run/types";
import type { EvidenceNeed } from "@/lib/analysis/evidence-needs";
/**
 * Domain types shared by the UI and the data layer.
 * The mock layer (`/mocks`) and, later, the real backend must both satisfy these.
 *
 * Veyra's core object is the investigation: a product or business problem worked
 * through evidence → findings → hypotheses → problem definition → opportunities →
 * next step → validation → learning. Types below follow that order.
 */

import type { AnalysisResult, ResearchMethodKey } from "@/lib/analysis/schema";
import type { EvidenceRelation, EvidenceStatus, Observed, StructuredRun } from "@/lib/analysis/structure";

export type ID = string;

/**
 * What kind of claim a piece of content represents. Never blur these.
 * observation = what the data directly shows; interpretation = what it may mean;
 * insight = a pattern across several sources; hypothesis = a possible explanation
 * to test; recommendation = a suggested action; unknown / open question = a gap.
 */
export type ArtifactKind =
  | "fact"
  | "observation"
  | "interpretation"
  | "insight"
  | "finding"
  | "hypothesis"
  | "recommendation"
  | "unknown"
  | "open-question";

export type Confidence = "low" | "low-medium" | "medium" | "medium-high" | "high";

/** How much evidence stands behind something — separate from how confident we are. */
export type EvidenceStrength = "weak" | "moderate" | "strong";

export type Level = "low" | "medium" | "high";

/** Where a product-discovery investigation currently is. */
export type InvestigationStatus =
  | "planning"
  | "investigating"
  | "customer-research"
  | "problem-definition"
  | "opportunity-discovery"
  | "validating"
  | "completed";

export type User = {
  id: ID;
  name: string;
  email: string;
  avatarInitial: string;
};

export type Industry =
  | "Technology"
  | "Consumer"
  | "Financial Services"
  | "Healthcare"
  | "Manufacturing"
  | "Professional Services"
  | "Other";

export type CompanySize = "1–10" | "11–50" | "51–200" | "201–500" | "500+";

/** The basic profile captured during onboarding. */
export type Company = {
  id: ID;
  name: string;
  description: string;
  industry: Industry;
  size: CompanySize;
};

/** Persistent business context, reused by every investigation. */
export type BusinessContext = {
  company: string;
  product: string;
  businessModel: string;
  targetCustomers: string;
  goals: string[];
  priorities: string[];
  keyMetrics: string[];
};

export type InvestigationTopic =
  | "engagement"
  | "revenue"
  | "retention"
  | "market"
  | "pricing"
  | "adoption"
  | "onboarding"
  | "operations";

export type InvestigationSummary = {
  id: ID;
  title: string;
  topic: InvestigationTopic;
  status: InvestigationStatus;
  /** The problem as currently understood (refined if it has been). */
  problem: string;
  evidenceCount: number;
  hypothesisCount: number;
  openQuestionCount: number;
  confidence: Confidence;
  updatedAt: string; // ISO
  /** The read-only demo investigation every workspace starts with. */
  isSample?: boolean;
};

/* ── Starting an investigation ───────────────────────────────────────── */

export type InvestigationTrigger =
  | "metric-changed"
  | "customer-feedback"
  | "stakeholder-request"
  | "market-opportunity"
  | "competitive-pressure"
  | "product-idea"
  | "other";

export type InvestigationOutcome =
  | "understand-change"
  | "identify-customer-problem"
  | "find-opportunities"
  | "evaluate-market"
  | "validate-idea"
  | "improve-product"
  | "decide-what-next"
  | "other";

export type ClarifyingQuestion = {
  id: ID;
  /** Absent while the investigation is still a draft. */
  investigationId?: ID;
  question: string;
  /** Empty means unanswered — Veyra treats it as an unknown. */
  answer: string;
  /** Why Veyra is asking. */
  hint?: string;
};

/** A piece of information needed to solve a problem, and whether the team has already given it. */
export type NeededInfo = { item: string; why: string; status: "known" | "partly-known" | "unknown" };

/** A method Veyra chose (or deliberately didn't) for this investigation. */
export type PlannedMethod = {
  id: ID;
  name: string;
  why: string;
  /** Data sources or evidence the method uses. */
  uses?: string[];
  status?: "done" | "in-progress" | "planned";
};

export type InvestigationPlan = {
  summary: string;
  methods: PlannedMethod[];
  /** Methods Veyra considered and left out, and why — shows the plan is adaptive. */
  notUsed: { name: string; why: string }[];
};

/** A new investigation before it's created. */
export type InvestigationDraft = {
  problem: string;
  /** What the team wants to achieve or decide, in their own words. Optional. */
  objective?: string;
  /** What prompted the investigation; can be several. */
  triggers: InvestigationTrigger[];
  /** What the team wants out of it; can be several. */
  outcomes: InvestigationOutcome[];
  /** What the team already knows, in their words. */
  knownContext: string;
  /** Names of files, links or research attached at the start. */
  attachments: string[];
  /** Data sources Veyra may use. */
  dataSourceIds: ID[];
  /** Cached once generated, so going back and forth keeps edited answers. */
  questions?: ClarifyingQuestion[];
  /** What Veyra worked out it needs to know to solve the problem; the questions fill the gaps. */
  needed?: NeededInfo[];
  plan?: InvestigationPlan;
};

/* ── Evidence ────────────────────────────────────────────────────────── */

/**
 * Evidence provenance, in order of the evidence hierarchy. Kept visibly distinct:
 * company data and customer evidence are first-party; public research is weakest.
 */
export type EvidenceCategory = "company-data" | "customer-evidence" | "uploaded-research" | "public-research" | "notes";

export type EvidenceFormat = "csv" | "xlsx" | "pdf" | "doc" | "link" | "text" | "dataset";

export type EvidenceItem = {
  id: ID;
  investigationId: ID;
  name: string;
  category: EvidenceCategory;
  /** The system or origin, e.g. "Product Analytics", "ERP", "Uploaded by you". */
  source: string;
  /** Dataset or report within the source, e.g. "Activation funnel". */
  dataset?: string;
  /** Period the evidence covers, e.g. "1 Aug – 30 Sep 2026". */
  coverage?: string;
  format: EvidenceFormat;
  addedAt: string; // ISO
  description?: string;
  url?: string;
  /** A few rows so people can see what the data contains. */
  preview?: { columns: string[]; rows: (string | number)[][] };
  /** Present for evidence added during the investigation; absent means already analysed. */
  analysis?: EvidenceAnalysis;
  /** Shown on public research: what limits its reliability. */
  qualityNote?: string;
  /** How far this evidence can be trusted, worked out in code, and why. */
  confidence?: "low" | "medium" | "high";
  confidenceReason?: string;
};

/** A finding or hypothesis's link to one evidence item: how it relates, and what the evidence shows. */
export type EvidenceLink = { evidenceId: ID; relation: EvidenceRelation; shows: string };
export type { EvidenceRelation, EvidenceStatus, Observed };

/* ── Uploaded data ─────────────────────────────────────────────────────── */

export type ColumnType = "number" | "date" | "boolean" | "category" | "identifier" | "text" | "empty";

/** One column of an uploaded dataset, described by code (not AI). */
export type ColumnProfile = {
  name: string;
  type: ColumnType;
  /** Rows with a value in this column. */
  filled: number;
  /** Different values seen (counting stops at 10,000). */
  distinct: number;
  number?: { min: number; max: number; mean: number; median: number; sum: number };
  date?: { from: string; to: string }; // ISO dates
  /** Most common values, for categories and yes/no columns. */
  top?: { value: string; count: number }[];
};

/** What an uploaded CSV contains. Every number here is computed in code. */
export type DatasetProfile = {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  /** The date column used for the period the data covers, if any. */
  dateColumn?: string;
  dateRange?: { from: string; to: string };
  /** Problems worth knowing before trusting the numbers. */
  issues: string[];
  preview: { columns: string[]; rows: string[][] };
  /** True when only the first rows were read (very large files). */
  truncated: boolean;
};

/** An uploaded file and, once processed, the evidence made from it. */
export type UploadedEvidence = {
  fileId: ID;
  evidenceId?: ID;
  name: string;
  sizeBytes: number;
  status: "uploading" | "processing" | "ready" | "failed";
  error?: string;
  summary?: string;
  coverage?: string;
  profile?: DatasetProfile;
  /** Trends and breakdowns worked out in code, when the file has dates. */
  metrics?: DataMetric[];
  confidence?: "low" | "medium" | "high";
  confidenceReason?: string;
  addedAt: string; // ISO
};

/** Evidence as listed outside its investigation (e.g. on the dashboard). */
export type EvidenceWithContext = EvidenceItem & { investigationTitle: string };

export type EvidenceAnalysis = {
  status: "analysing" | "analysed";
  /** What Veyra concluded about this evidence. */
  summary?: string;
};

/**
 * A change Veyra suggests after analysing new evidence. Nothing changes in the
 * investigation until a person accepts it.
 */
export type EvidenceProposal = {
  id: ID;
  investigationId: ID;
  evidenceId: ID;
  action: "supports-hypothesis" | "contradicts-hypothesis" | "supports-finding";
  targetId: ID;
  summary: string;
  status: "pending" | "accepted" | "dismissed";
};

/** How a piece of evidence relates to a claim. */
export type EvidenceRole = "supporting" | "contradicting" | "unknown" | "requires-validation";

/* ── Findings, questions, hypotheses ─────────────────────────────────── */

/** One step in how Veyra reached a conclusion — shown when someone asks "Why?". */
export type TrailStep = { text: string; evidenceId?: ID };

export type FindingKind = "observation" | "interpretation" | "insight";

export type Finding = {
  id: ID;
  investigationId: ID;
  kind: FindingKind;
  /** Short headline for cards (real investigations); the statement is the detail. */
  title?: string;
  statement: string;
  confidence: Confidence;
  /** Why the confidence is what it is. */
  confidenceReason: string;
  evidenceIds: ID[];
  /** Every evidence item cited, with whether it supports or contradicts the finding and what it shows. */
  evidenceLinks?: EvidenceLink[];
  /** What was measured and the values seen, copied from the data. */
  observed?: Observed;
  /** For interpretations and insights: the observations they build on. */
  basedOnFindingIds?: ID[];
  detail?: {
    metricLabel: string;
    before: { label: string; value: string };
    after: { label: string; value: string };
    change: string;
    supporting: string[];
    contradicting: string[];
    unknowns: string[];
  };
  trail: TrailStep[];
};

/** Something important Veyra doesn't know yet. */
export type OpenQuestion = {
  id: ID;
  investigationId: ID;
  question: string;
  whyItMatters: string;
  /** The evidence that is missing today and would answer it. */
  missingEvidence?: string;
  /** The research task that would answer it. */
  researchTaskId?: ID;
  /** Set once research answers it. */
  answeredByFindingId?: ID;
};

export type Hypothesis = {
  id: ID;
  investigationId: ID;
  /** Short reference, e.g. "H1". */
  label: string;
  /** Short headline for cards (real investigations). */
  title?: string;
  statement: string;
  confidence: Confidence;
  evidenceStrength: EvidenceStrength;
  rationale: string;
  supportingFindingIds: ID[];
  contradictingFindingIds: ID[];
  /** Evidence linked directly (e.g. accepted from a suggestion). */
  supportingEvidenceIds?: ID[];
  contradictingEvidenceIds?: ID[];
  /** Evidence checked that can't settle it. */
  insufficientEvidenceIds?: ID[];
  evidenceLinks?: EvidenceLink[];
  /** What the evidence says overall. */
  evidenceStatus?: EvidenceStatus;
  openQuestions: string[];
  /** How Veyra suggests testing it: what would have to be shown, and how. */
  validationMethod: string;
  /** What must be true for it to hold. */
  assumptions?: string[];
  /** Set once a validation settles it. Untested hypotheses stay "open". */
  status?: "open" | "confirmed" | "rejected" | "unclear";
  /** The validation testing it (real investigations). */
  validationId?: ID;
};

/* ── Research, customers, market ─────────────────────────────────────── */

export type ResearchMethod =
  | "Analytics"
  | "Product analytics"
  | "Customer interviews"
  | "Feedback analysis"
  | "Usability testing"
  | "Survey"
  | "Competitor research"
  | "Market research"
  | "Experiment"
  | "Desk research";

export type ResearchTask = {
  id: ID;
  investigationId: ID;
  title: string;
  /** The question this research answers. */
  question: string;
  method: ResearchMethod;
  priority: Level;
  status: "not-started" | "in-progress" | "done" | "dropped";
  /** Whether Veyra can run it against connected data (vs. needing people). */
  runnable: boolean;
  /** Filled in once the task has produced a result. */
  result?: string;
};

/** A customer-understanding tool and whether it fits this investigation right now. */
export type CustomerTool = {
  id: ID;
  name: string;
  status: "used" | "recommended" | "later" | "not-relevant";
  reason: string;
};

export type FeedbackTheme = { theme: string; mentions: number; example: string };

export type CustomerSegment = { name: string; description: string; metric: string };

export type CustomerUnderstanding = {
  segments: CustomerSegment[];
  themes: FeedbackTheme[];
  tools: CustomerTool[];
};

export type MarketContext = {
  status: "not-started" | "in-progress" | "done";
  summary: string;
};

/* ── Problem, opportunities, ideas ───────────────────────────────────── */

/** The problem, refined by evidence. Always a problem — never a solution. */
export type ProblemStatement = {
  original: string;
  whatEvidenceSuggests: string;
  refined: string;
  whoIsAffected: string;
  tryingTo: string;
  inTheWay: string;
  consequence: string;
  confidence: Confidence;
  findingIds: ID[];
};

export type Assessment = {
  criterion: "Impact" | "Evidence strength" | "Confidence" | "Effort" | "Strategic alignment" | "Customer value";
  rating: string;
  reasoning: string;
};

export type SolutionIdea = {
  id: ID;
  title: string;
  problemAddressed: string;
  evidence: string;
  expectedImpact: Level;
  assumptions: string[];
  risks: string[];
};

/** An area worth solving for. Not a feature. */
export type Opportunity = {
  id: ID;
  investigationId: ID;
  title: string;
  description: string;
  evidenceStrength: EvidenceStrength;
  /** Absent when nothing in the evidence supports an estimate. */
  impact?: Level;
  confidence: Confidence;
  assessment: Assessment[];
  /** Solution directions — explored only once the problem is understood. */
  ideas: SolutionIdea[];
};

/* ── Next step, validation, decisions ────────────────────────────────── */

export type NextStepType = "research" | "analysis" | "validation" | "solution-exploration" | "hold";

/** What Veyra suggests doing next. Often research or validation, not "build X". */
export type NextStep = {
  id: ID;
  investigationId: ID;
  type: NextStepType;
  title: string;
  detail: string;
  why: string;
  /** Why Veyra isn't recommending building something yet (when it isn't). */
  whyNotBuildYet?: string;
  researchTaskIds: ID[];
  wouldChangeIf: string[];
  confidence?: Confidence;
  /** Other reasonable next steps, not ranked. */
  alternatives: { type: NextStepType; title: string; why: string }[];
  /** The investigation step Veyra judged right for the latest analysis, and how far the evidence went. */
  approach?: { step: "establish-facts" | "explain-change" | "fill-gaps" | "test-hypotheses"; why: string; evidenceSufficiency: "sufficient" | "partial" | "insufficient" };
};

export type ValidationPlan = {
  id: ID;
  investigationId: ID;
  hypothesisId: ID;
  belief: string;
  supportedBy: string[];
  wouldDisprove: string;
  test: string;
  successSignal: string;
  metric: string;
  status: "not-started" | "running" | "completed";
  startedAt?: string; // ISO
  /** What the test found. Arrives while running; the team then records a verdict. */
  result?: ValidationResult;
  /** The team's verdict, recorded when the validation completes. */
  outcome?: "confirmed" | "rejected";
  completedAt?: string; // ISO
};

export type ValidationResult = {
  summary: string;
  details: string[];
  /** Whether the success signal was met — Veyra suggests, the team decides. */
  signalMet: boolean;
  signal: string;
  suggestedOutcome: "confirmed" | "rejected";
  /** Open questions this result answers, once the team records a verdict. */
  answers: ID[];
};

/** The opportunity (and optionally the first solution direction) the team chose to pursue. */
export type OpportunityChoice = {
  opportunityId: ID;
  ideaId?: ID;
  decidedAt: string; // ISO
};

export type InvestigationNote = {
  id: ID;
  investigationId: ID;
  author: string;
  text: string;
  createdAt: string; // ISO
};

export type DecisionStatus = "proposed" | "decided" | "in-experiment" | "validated";

export type DecisionRecord = {
  id: ID;
  investigationId: ID;
  investigationTitle: string;
  decision: string;
  status: DecisionStatus;
  decidedAt: string; // ISO
  owner: string;
  rationale?: string;
  outcome?: string;
  /** Real decisions: which of the seven outcomes, warnings it was decided despite, and follow-up. */
  kind?: DecisionOutcome;
  warnings?: string[];
  reviewDate?: string;
  successMeasure?: string;
};

/* ── Data sources ────────────────────────────────────────────────────── */

export type DataSourceGroup = "company-systems" | "customer-evidence" | "external";

export type DataSource = {
  id: ID;
  name: string;
  group: DataSourceGroup;
  description: string;
  status: "connected" | "not-connected";
  lastSyncedAt?: string; // ISO
  /** Realistic headline numbers, e.g. { label: "Orders", value: "182,421" }. */
  metrics?: { label: string; value: string }[];
};

/* ── Business memory ─────────────────────────────────────────────────── */

export type MemoryCategory =
  | "company"
  | "segments"
  | "validated-problems"
  | "rejected-hypotheses"
  | "investigations"
  | "research"
  | "decisions"
  | "experiments"
  | "learnings"
  | "customer-insights"
  | "outcomes";

export type MemoryEntry = {
  id: ID;
  category: MemoryCategory;
  title: string;
  body: string;
  date?: string; // ISO
  sourceInvestigationId?: ID;
  sourceInvestigationTitle?: string;
  /** Real entries: the stored kind (e.g. "validated-problem"). */
  kind?: string;
};

/** An investigation's journey from problem to learning, as kept in Business Memory. */
export type MemoryStory = {
  id: ID;
  investigationId: ID;
  investigationTitle: string;
  date: string; // ISO
  problem: string;
  decision: string;
  experiment: string;
  result: string;
  learning: string;
};

export type BusinessMemory = {
  entries: MemoryEntry[];
  stories: MemoryStory[];
};

/* ── Veyra AI ────────────────────────────────────────────────────────── */

export type ChatRole = "user" | "assistant";

/** A link from a chat message to a structured artifact. Chat always points back to the investigation. */
export type ArtifactRef = {
  kind: "finding" | "hypothesis" | "evidence" | "problem" | "next-step" | "research" | "opportunities" | "validation" | "report";
  id: ID;
  label: string;
};

export type ChatMessage = {
  id: ID;
  role: ChatRole;
  text: string;
  list?: string[];
  refs?: ArtifactRef[];
  createdAt: string;
};

/* ── Investigation workspace ─────────────────────────────────────────── */

export type Kpi = {
  id: ID;
  label: string;
  value: string;
  detail: string;
  /** "decline" = a real drop worth flagging; "stable" = checked and unchanged; "neutral" = context. */
  kind: "decline" | "stable" | "neutral";
  icon: "users" | "funnel" | "retention" | "evidence" | "metric";
  sourceEvidenceId?: ID;
  /** Which way the figure moved, when worked out from the data (shown without judging good or bad). */
  direction?: "up" | "down" | "flat";
  /** The finding the card comes from; clicking opens it. */
  findingId?: ID;
};

export type TrendPoint = { period: string; value: number; annotation?: string };

/** Two rates tracked over the same periods, e.g. activation vs retention. */
export type RatePoint = { period: string; primary: number; secondary: number; annotation?: string };

/** How a node on the investigation map reads. Colour follows meaning, not decoration. */
export type MapSignal = "problem" | "minor" | "stable" | "event" | "unknown";

export type MapNode = { id: ID; label: string; value: string; signal: MapSignal };

export type MapBranch = {
  id: ID;
  label: string;
  /** Where Veyra is on this line of enquiry. */
  assessment: string;
  uncertain: boolean;
  children: MapNode[];
};

export type InvestigationMap = {
  root: { label: string; value: string };
  branches: MapBranch[];
};

/** One stage of this investigation's discovery path (stages differ per investigation). */
export type DiscoveryStage = { id: ID; label: string; status: "done" | "in-progress" | "pending" };

/**
 * A saved investigation as the New Investigation flow captured it — before
 * any data has been analysed. Shown on the investigation's brief page.
 */
/** Where an investigation is. Stored in the database and moved by it. */
export type StageKey = "problem_definition" | "add_data" | "analysis" | "problem_validation" | "opportunity_discovery";

/** One AI analysis of an investigation's evidence, as stored. */
export type AnalysisRunRecord = {
  id: ID;
  status: "running" | "completed" | "failed" | "refused" | "truncated";
  model: string;
  createdAt: string; // ISO
  completedAt?: string; // ISO
  /** Plain-English reason when the run didn't complete. */
  error?: string;
  /** Set when status is "completed". */
  result?: AnalysisResult;
  /** The datasets analysed, by reference ("E1"…) in the order the analysis cites them. */
  datasets: { ref: string; evidenceId: ID; name: string; period?: string }[];
  /** What was dropped for not tracing back to the data. */
  removed: string[];
  /** The run's findings and hypotheses as saved rows, with their evidence links. Absent for runs saved before the rows existed. */
  structured?: StructuredRun;
};

/** The refined problem as stored (Milestone 8): written on request after the analysis. */
export type ProblemDefinitionRecord = {
  id: ID;
  /** The analysis it was written from; if a newer analysis exists, it's out of date. */
  runId?: ID;
  statement: string;
  affected: string;
  need: string;
  obstacle: string;
  businessImpact: string;
  confidence: "low" | "medium" | "high";
  confidenceReason: string;
  assumptions: string[];
  findingRefs: string[];
  hypothesisRefs: string[];
  /** "open" until a hypothesis about the cause is validated: the definition is provisional. */
  causeStatus: "open" | "validated";
  links: EvidenceLink[];
  createdAt: string;
};

/** An opportunity area as stored: found from a problem definition. Not a feature. */
export type OpportunityRecord = {
  id: ID;
  title: string;
  customerProblem: string;
  potentialImpact: string;
  impactLevel: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  assumptions: string[];
  validationNeeds: string[];
  findingRefs: string[];
  /** Hypotheses it assumes are true; empty while the cause is open. */
  dependsOn: string[];
  links: EvidenceLink[];
  status: "open" | "pursuing" | "parked";
};

/** A research task as stored: suggested by an analysis run, worked on by the team. */
export type ResearchTaskRecord = {
  id: ID;
  runId?: ID;
  title: string;
  question: string;
  method: ResearchMethodKey;
  methodDetail: string;
  priority: "high" | "medium" | "low";
  status: "not-started" | "in-progress" | "done" | "dropped";
  rationale: string;
  questionRef?: string;
  hypothesisRefs: string[];
  outcome: string;
  createdAt: string;
  updatedAt: string;
};

export type InvestigationRecord = {
  summary: InvestigationSummary;
  objective: string;
  currentStage: StageKey;
  /** Every stage in order, with its status from the stage history. */
  stages: DiscoveryStage[];
  triggers: InvestigationTrigger[];
  outcomes: InvestigationOutcome[];
  knownContext: string;
  attachments: string[];
  dataSourceIds: ID[];
  questions: ClarifyingQuestion[];
  plan: InvestigationPlan | null;
  /** Uploaded files and the evidence made from them, newest first. */
  uploads: UploadedEvidence[];
  /** Evidence taken from connected sources (e.g. Demo ERP), newest first. */
  sourceEvidence: SourceEvidence[];
  /** AI analysis runs, newest first. */
  analysisRuns: AnalysisRunRecord[];
  /** Research tasks suggested by any run, oldest first; the team moves their status. */
  researchTasks: ResearchTaskRecord[];
  /** The newest problem definition, if the team has asked for one. */
  problemDefinition?: ProblemDefinitionRecord;
  /** Opportunity areas found from that problem definition. */
  opportunities: OpportunityRecord[];
  /** Hypothesis validations, oldest first (Milestone 9). */
  validations: ValidationRecord[];
  /** Decisions recorded, newest first. */
  decisions: InvestigationDecision[];
  /** The newest Decision Brief, if one was written. */
  brief?: BriefRecord;
  createdAt: string; // ISO
};

/** How a hypothesis is being tested, and the team's call once it's settled. */
export type ValidationRecord = {
  id: ID;
  hypothesisTitle: string;
  hypothesisStatement: string;
  method: string;
  test: string;
  confirmIf: string;
  rejectIf: string;
  /** The evidence the test needs: what, from where, how much is enough. */
  evidenceNeeded: EvidenceNeed[];
  status: "planned" | "in-progress" | "settled";
  outcome?: "confirmed" | "rejected" | "unclear";
  reason: string;
  settledAt?: string;
  /** Who made the call: the team, or Veyra's own validation run. */
  settledBy: "team" | "veyra";
  confidence?: "low" | "medium" | "high";
  /** Veyra's newest run on this validation, if any. */
  run?: ValidationRunRecord;
  /** needId: the checklist item a piece of evidence covers. */
  notes: {
    id: ID;
    kind: "note" | "research-task" | "test-result" | "web" | "text-analysis" | "answer";
    relation: "supports" | "contradicts" | "neutral";
    body: string;
    researchTaskId?: ID;
    needId?: string;
    /** Set on evidence Veyra gathered itself. */
    byVeyra: boolean;
    createdAt: string;
  }[];
  datasets: { id: ID; evidenceId: ID; relation: "supports" | "contradicts"; shows: string; needId?: string }[];
  createdAt: string;
};

export type DecisionOutcome =
  | "solution-exploration"
  | "customer-research"
  | "validate-hypothesis"
  | "investigate-further"
  | "no-intervention"
  | "escalate"
  | "prioritize-opportunity";

/** A decision the team recorded on an investigation. Recording one completes the investigation. */
export type InvestigationDecision = {
  id: ID;
  outcome: DecisionOutcome;
  summary: string;
  rationale: string;
  opportunityId?: ID;
  opportunityTitle: string;
  escalateTo: string;
  optionsRejected: string[];
  risks: string[];
  owner: string;
  successMeasure: string;
  reviewDate?: string;
  /** What happened, recorded later. */
  result: string;
  /** What the decision rests on that isn't validated, worked out when it was recorded. */
  warnings: string[];
  createdAt: string;
};

export type BriefRecord = { id: ID; content: DecisionBrief; shareToken?: string; createdAt: string };

/** The Decision Brief as saved: a snapshot of the investigation when it was written. */
export type DecisionBrief = {
  version: 1;
  generatedAt: string;
  investigationTitle: string;
  problemAsked: string;
  /** 1 */
  executiveSummary: string;
  /** 2 */
  found: { ref: string; title: string; statement: string; observed?: string; confidence: Confidence }[];
  /** 3 */
  believe: {
    summary: string;
    validated: { title: string; statement: string; reason: string }[];
    unvalidated: { ref: string; title: string; statement: string; evidenceStatus: string }[];
    rejected: { title: string; statement: string; reason: string }[];
  };
  /** 4 */
  evidence: {
    datasets: { name: string; source: string; coverage?: string; confidence?: Confidence; confidenceReason?: string }[];
    validationEvidence: number;
    researchDone: { title: string; outcome: string }[];
  };
  /** 5 */
  confidence: { level: Confidence; reason: string; capped?: string };
  /** 6 */
  unknowns: { openQuestions: { question: string; missingEvidence: string }[]; assumptions: string[]; untested: string[] };
  /** 7 */
  problem: { statement: string; affected: string; need: string; obstacle: string; businessImpact: string; provisional: boolean } | null;
  /** 8 */
  opportunity: {
    pursued: { title: string; customerProblem: string; potentialImpact: string; dependsOn: string[] }[];
    others: { title: string; status: string }[];
  };
  /** 9 */
  solutionDirections: { allowed: boolean; why: string; items: { title: string; description: string; assumptions: string[]; risks: string[] }[] };
  /** 10 */
  recommendation: { outcome: DecisionOutcome; title: string; reasoning: string; wouldChangeIf: string[]; escalateTo: string; changedFrom?: DecisionOutcome; changedWhy?: string };
  /** 11 */
  validationPlan: {
    existing: { hypothesis: string; method: string; status: string; outcome?: string; evidence?: string }[];
    proposed: { what: string; how: string; successSignal: string }[];
  };
  /** 12, as it stood when the brief was written; screens show the live decision. */
  decisionStatus: { decided: boolean; summary?: string; outcome?: DecisionOutcome; owner?: string; decidedAt?: string };
  /** Lessons Veyra proposes for Business Memory; the team saves the ones worth keeping. */
  lessons: { title: string; body: string }[];
};

export type Investigation = InvestigationSummary & {
  subtitle: string;
  triggers: InvestigationTrigger[];
  outcomes: InvestigationOutcome[];
  createdAt: string; // ISO
};

export type InvestigationWorkspace = {
  investigation: Investigation;
  stages: DiscoveryStage[];
  plan: InvestigationPlan;
  questions: ClarifyingQuestion[];
  kpis: Kpi[];
  trend: { title: string; metric: string; unit: string; points: TrendPoint[]; sourceEvidenceId?: ID };
  rates: {
    title: string;
    primaryLabel: string;
    secondaryLabel: string;
    points: RatePoint[];
    sourceEvidenceId?: ID;
  };
  map: InvestigationMap;
  evidence: EvidenceItem[];
  findings: Finding[];
  openQuestions: OpenQuestion[];
  hypotheses: Hypothesis[];
  researchTasks: ResearchTask[];
  customers: CustomerUnderstanding;
  market: MarketContext;
  problem: ProblemStatement;
  opportunities: Opportunity[];
  nextStep: NextStep;
  validations: ValidationPlan[];
  /** Business Memory entries relevant to this investigation. */
  relatedMemory: MemoryEntry[];
  /** The conversation so far with Veyra AI. */
  conversation: ChatMessage[];
  /** Suggested changes from analysing new evidence. */
  proposals: EvidenceProposal[];
  notes: InvestigationNote[];
  /**
   * The team's own investigation: its saved record and latest completed analysis.
   * Absent on the sample, whose content is demo data.
   */
  live?: LiveInvestigation;
};

export type LiveInvestigation = {
  record: InvestigationRecord;
  dataSources: DataSource[];
  /** The latest analysis that completed, if any. */
  run?: AnalysisRunRecord & { result: AnalysisResult };
};

/* ── Data onboarding ─────────────────────────────────────────────────── */

/** A validation result shown to people: fine, worth knowing, or blocking. */
export type DataCheck = { level: "ok" | "warning" | "error"; text: string };

/** A calculation over a dataset, worked out in code (lib/data-layer/metrics.ts). */
export type DataMetric = { id: string; title: string; unit: string; columns: string[]; rows: (string | number)[][]; note?: string };

/** A connected source and its datasets, as the Data Sources pages show it. */
export type ConnectedSource = {
  id: string;
  kind: string;
  connector: string;
  name: string;
  status: "connected" | "error";
  lastSyncedAt?: string;
  createdAt: string;
  datasets: SourceDatasetView[];
};

export type SourceDatasetView = {
  id: string;
  key: string;
  name: string;
  description: string;
  approxRows: number;
  selected: boolean;
  entity: string | null;
  schema: { fields: { name: string; sourceType: string; description?: string }[]; sample: Record<string, string>[] } | null;
  mapping: Record<string, string | null>;
  mappingConfirmed: boolean;
  /** The newest snapshot, if it has been synced. */
  latest?: SnapshotView;
};

export type SnapshotView = {
  id: string;
  name: string;
  sourceName: string;
  entity: string;
  rowCount: number;
  rejectedCount: number;
  coverage?: string;
  summary: string;
  checks: DataCheck[];
  metrics: DataMetric[];
  createdAt: string;
};

/** Evidence taken from a connected source, as an investigation shows it. */
export type SourceEvidence = {
  evidenceId: string;
  snapshotId?: string;
  name: string;
  source: string;
  coverage?: string;
  summary: string;
  profile?: DatasetProfile;
  metrics: DataMetric[];
  confidence?: "low" | "medium" | "high";
  confidenceReason?: string;
  addedAt: string;
};
