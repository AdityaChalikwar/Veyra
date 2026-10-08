/**
 * Domain types shared by the UI and the data layer.
 * The mock layer (`/mocks`) and, later, the real backend must both satisfy these.
 *
 * Veyra's core object is the investigation: a product or business problem worked
 * through evidence → findings → hypotheses → problem definition → opportunities →
 * next step → validation → learning. Types below follow that order.
 */

import type { AnalysisResult } from "@/lib/analysis/schema";

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
  trigger: InvestigationTrigger | null;
  outcome: InvestigationOutcome | null;
  /** What the team already knows, in their words. */
  knownContext: string;
  /** Names of files, links or research attached at the start. */
  attachments: string[];
  /** Data sources Veyra may use. */
  dataSourceIds: ID[];
  /** Cached once generated, so going back and forth keeps edited answers. */
  questions?: ClarifyingQuestion[];
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
};

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
  statement: string;
  confidence: Confidence;
  /** Why the confidence is what it is. */
  confidenceReason: string;
  evidenceIds: ID[];
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
  statement: string;
  confidence: Confidence;
  evidenceStrength: EvidenceStrength;
  rationale: string;
  supportingFindingIds: ID[];
  contradictingFindingIds: ID[];
  /** Evidence linked directly (e.g. accepted from a suggestion). */
  supportingEvidenceIds?: ID[];
  contradictingEvidenceIds?: ID[];
  openQuestions: string[];
  /** How Veyra suggests testing it. */
  validationMethod: string;
  /** Set once a validation settles it. Untested hypotheses stay "open". */
  status?: "open" | "confirmed" | "rejected";
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
  | "Market research";

export type ResearchTask = {
  id: ID;
  investigationId: ID;
  title: string;
  /** The question this research answers. */
  question: string;
  method: ResearchMethod;
  priority: Level;
  status: "not-started" | "in-progress" | "done";
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
  | "learnings";

export type MemoryEntry = {
  id: ID;
  category: MemoryCategory;
  title: string;
  body: string;
  date?: string; // ISO
  sourceInvestigationId?: ID;
  sourceInvestigationTitle?: string;
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
  icon: "users" | "funnel" | "retention" | "evidence";
  sourceEvidenceId?: ID;
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
};

export type InvestigationRecord = {
  summary: InvestigationSummary;
  objective: string;
  currentStage: StageKey;
  /** Every stage in order, with its status from the stage history. */
  stages: DiscoveryStage[];
  trigger: InvestigationTrigger | null;
  outcome: InvestigationOutcome | null;
  knownContext: string;
  attachments: string[];
  dataSourceIds: ID[];
  questions: ClarifyingQuestion[];
  plan: InvestigationPlan | null;
  /** Uploaded files and the evidence made from them, newest first. */
  uploads: UploadedEvidence[];
  /** AI analysis runs, newest first. */
  analysisRuns: AnalysisRunRecord[];
  createdAt: string; // ISO
};

export type Investigation = InvestigationSummary & {
  subtitle: string;
  trigger: InvestigationTrigger;
  outcome: InvestigationOutcome;
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
