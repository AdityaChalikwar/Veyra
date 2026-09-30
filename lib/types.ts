/**
 * Domain types shared by the UI and the data layer.
 * The mock layer (`/mocks`) and, later, the real backend must both satisfy these.
 */

export type ID = string;

/** What kind of claim a piece of content represents. Never blur these. */
export type ArtifactKind = "fact" | "finding" | "hypothesis" | "recommendation" | "unknown";

export type Confidence = "low" | "low-medium" | "medium" | "medium-high" | "high";

export type Level = "low" | "medium" | "high";

export type InvestigationStage =
  | "setup"
  | "evidence"
  | "analysis"
  | "diagnosis"
  | "recommendation"
  | "action";

export type InvestigationStatus =
  | "planning"
  | "investigating"
  | "diagnosing"
  | "recommendation"
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

export type Company = {
  id: ID;
  name: string;
  description: string;
  industry: Industry;
  size: CompanySize;
};

export type BusinessContext = {
  product: string;
  businessModel: string;
  timePeriod: string;
};

/** Broad problem area. Drives the icon shown next to an investigation. */
export type InvestigationTopic = "engagement" | "revenue" | "retention" | "market" | "pricing" | "adoption";

export type InvestigationSummary = {
  id: ID;
  title: string;
  topic: InvestigationTopic;
  status: InvestigationStatus;
  stage: InvestigationStage;
  progress: number; // 0–100
  headline: string;
  updatedAt: string; // ISO
};

export type Investigation = InvestigationSummary & {
  problem: string;
  goal: string;
  subtitle: string;
  context: BusinessContext;
  createdAt: string; // ISO
};

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

/** A new investigation before it's created. */
export type InvestigationDraft = {
  problem: string;
  goal: string;
  context: BusinessContext;
  /** Cached once generated, so going back and forth keeps edited answers. */
  questions?: ClarifyingQuestion[];
};

export type EvidenceCategory = "company-data" | "research" | "notes" | "other";

export type EvidenceItem = {
  id: ID;
  investigationId: ID;
  name: string;
  category: EvidenceCategory;
  source: string; // e.g. "Product Analytics"
  coverage?: string; // e.g. "Jan – Aug 2026"
  format: EvidenceFormat;
  addedAt: string; // ISO
};

export type EvidenceFormat = "csv" | "xlsx" | "pdf" | "doc" | "link" | "text";

/** Evidence as listed outside its investigation (e.g. on the dashboard). */
export type EvidenceWithContext = EvidenceItem & { investigationTitle: string };

export type Finding = {
  id: ID;
  investigationId: ID;
  statement: string;
  confidence: Confidence;
  evidenceIds: ID[];
  detail?: {
    metricLabel: string;
    before: { label: string; value: string };
    after: { label: string; value: string };
    change: string;
    supporting: string[];
    contradicting: string[];
    unknowns: string[];
  };
};

export type Hypothesis = {
  id: ID;
  investigationId: ID;
  statement: string;
  confidence: Confidence;
  supportingFindingIds: ID[];
  contradictingFindingIds: ID[];
  nextTest?: string;
};

export type Diagnosis = {
  investigationId: ID;
  known: string[];
  suspected: string[];
  unknown: string[];
  evidenceGaps: string[];
};

export type Recommendation = {
  id: ID;
  investigationId: ID;
  title: string;
  rationale: string;
  impact: Level;
  effort: Level;
  risk: Level;
  confidence: Confidence;
  supportingFindingIds: ID[];
  wouldChangeIf: string[];
  isPrimary: boolean;
};

export type ActionStatus = "not-started" | "in-progress" | "done" | "blocked";

export type ActionItem = {
  id: ID;
  investigationId: ID;
  week: number;
  title: string;
  owner: string;
  status: ActionStatus;
  expectedOutcome: string;
  measurement: string;
};

export type ResearchItem = {
  id: ID;
  title: string;
  kind: "uploaded" | "industry" | "public";
  sourceLabel: string;
  addedAt: string; // ISO
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
};

export type MemoryCategory =
  | "company"
  | "products"
  | "customers"
  | "segments"
  | "investigations"
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

export type ChatRole = "user" | "assistant";

/** A link from a chat message to a structured artifact. Chat always points back to the investigation. */
export type ArtifactRef = {
  kind: ArtifactKind | "evidence" | "action";
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
  /** "decline" = a real drop worth flagging; "neutral" = context; "status" = investigation state. */
  kind: "decline" | "neutral" | "status";
  icon: "users" | "funnel" | "segment" | "status";
  progress?: number;
  sourceEvidenceId?: ID;
};

export type TrendPoint = { period: string; value: number; annotation?: string };

export type SegmentComparison = {
  segment: string;
  before: number;
  after: number;
  /** Relative change, e.g. -0.61. */
  change: number;
};

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

export type InvestigationWorkspace = {
  investigation: Investigation;
  kpis: Kpi[];
  trend: { title: string; metric: string; unit: string; points: TrendPoint[]; sourceEvidenceId?: ID };
  segments: { title: string; beforeLabel: string; afterLabel: string; rows: SegmentComparison[]; sourceEvidenceId?: ID };
  map: InvestigationMap;
  questions: ClarifyingQuestion[];
  evidence: EvidenceItem[];
};
