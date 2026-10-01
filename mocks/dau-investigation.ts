/**
 * The primary demo: "Our DAU dropped 40%" at Acme Commerce.
 * Story: DAU fell 40% in the 8 weeks after onboarding release 4.2 (4 Aug).
 * New-user activation fell 42% → 29%; existing-user retention held steady.
 * A July shift towards paid search is a competing explanation (H2).
 */
import { ago } from "@/lib/time";
import type {
  ValidationResult,
  ChatMessage,
  CustomerUnderstanding,
  DiscoveryStage,
  EvidenceItem,
  Finding,
  Hypothesis,
  InvestigationMap,
  InvestigationWorkspace,
  Kpi,
  NextStep,
  OpenQuestion,
  Opportunity,
  ProblemStatement,
  RatePoint,
  ResearchTask,
  TrendPoint,
  ValidationPlan,
} from "@/lib/types";
import { mockMemory } from "./memory";
import { dauPlan, demoQuestions } from "./new-investigation";

const inv = "dau-decline";

const stages: DiscoveryStage[] = [
  { id: "s-problem", label: "Problem definition", status: "done" },
  { id: "s-internal", label: "Internal data analysis", status: "done" },
  { id: "s-customer", label: "Customer evidence", status: "done" },
  { id: "s-market", label: "Market context", status: "in-progress" },
  { id: "s-validation", label: "Problem validation", status: "pending" },
  { id: "s-opportunity", label: "Opportunity discovery", status: "pending" },
];

const kpis: Kpi[] = [
  { id: "kpi-dau", label: "Daily Active Users", value: "−40%", detail: "120K → 72K in 8 weeks", kind: "decline", icon: "users", sourceEvidenceId: "ev-dau" },
  { id: "kpi-activation", label: "New-user Activation", value: "−31%", detail: "42% → 29%", kind: "decline", icon: "funnel", sourceEvidenceId: "ev-activation" },
  { id: "kpi-retention", label: "Existing-user Retention", value: "Stable", detail: "81% → 79% (4-week)", kind: "stable", icon: "retention", sourceEvidenceId: "ev-cohorts" },
  { id: "kpi-evidence", label: "Evidence", value: "8 sources", detail: "6 company data · 2 customer", kind: "neutral", icon: "evidence" },
];

// Weekly DAU (thousands). Flat until release 4.2 on 4 August, then falling for 8 weeks.
const trend: TrendPoint[] = [
  { period: "29 Jun", value: 119 },
  { period: "6 Jul", value: 121 },
  { period: "13 Jul", value: 120 },
  { period: "20 Jul", value: 118 },
  { period: "27 Jul", value: 120 },
  { period: "3 Aug", value: 120, annotation: "Onboarding change (4 Aug)" },
  { period: "10 Aug", value: 113 },
  { period: "17 Aug", value: 106 },
  { period: "24 Aug", value: 99 },
  { period: "31 Aug", value: 92 },
  { period: "7 Sep", value: 86 },
  { period: "14 Sep", value: 80 },
  { period: "21 Sep", value: 75 },
  { period: "28 Sep", value: 72 },
];

// New-user activation (%) vs existing-user 4-week retention (%), same weeks.
const rates: RatePoint[] = [
  { period: "29 Jun", primary: 42, secondary: 81 },
  { period: "6 Jul", primary: 43, secondary: 80 },
  { period: "13 Jul", primary: 42, secondary: 81 },
  { period: "20 Jul", primary: 41, secondary: 81 },
  { period: "27 Jul", primary: 42, secondary: 80 },
  { period: "3 Aug", primary: 42, secondary: 81, annotation: "Onboarding change (4 Aug)" },
  { period: "10 Aug", primary: 38, secondary: 80 },
  { period: "17 Aug", primary: 35, secondary: 80 },
  { period: "24 Aug", primary: 33, secondary: 79 },
  { period: "31 Aug", primary: 31, secondary: 80 },
  { period: "7 Sep", primary: 30, secondary: 79 },
  { period: "14 Sep", primary: 30, secondary: 79 },
  { period: "21 Sep", primary: 29, secondary: 79 },
  { period: "28 Sep", primary: 29, secondary: 79 },
];

const map: InvestigationMap = {
  root: { label: "DAU Decline", value: "−40%" },
  branches: [
    {
      id: "product",
      label: "Product",
      assessment: "Leading line of enquiry",
      uncertain: true,
      children: [
        { id: "release", label: "Onboarding change", value: "4 Aug", signal: "event" },
        { id: "activation", label: "New-user activation", value: "−31%", signal: "problem" },
        { id: "core", label: "Core feature usage", value: "No major change", signal: "stable" },
      ],
    },
    {
      id: "acquisition",
      label: "Acquisition",
      assessment: "Channel mix changed — untested",
      uncertain: true,
      children: [
        { id: "mix", label: "Paid search share", value: "31% → 49%", signal: "event" },
        { id: "signups", label: "Signup volume", value: "+4%", signal: "stable" },
        { id: "by-channel", label: "Activation by channel", value: "Unknown", signal: "unknown" },
      ],
    },
    {
      id: "retention",
      label: "Retention",
      assessment: "Existing users stable",
      uncertain: false,
      children: [
        { id: "existing", label: "Existing users (4-week)", value: "−2 pts", signal: "minor" },
        { id: "first-orders", label: "First orders (ERP)", value: "−24%", signal: "problem" },
        { id: "reactivation", label: "Reactivation", value: "Unknown", signal: "unknown" },
      ],
    },
  ],
};

export const dauFindings: Finding[] = [
  // Observations — what the data directly shows
  {
    id: "f-dau",
    investigationId: inv,
    kind: "observation",
    statement: "DAU declined 40% over 8 weeks.",
    confidence: "high",
    confidenceReason: "Measured directly in product analytics; consistent week to week.",
    evidenceIds: ["ev-dau"],
    detail: {
      metricLabel: "Daily active users (weekly average)",
      before: { label: "Week of 3 Aug", value: "120K" },
      after: { label: "Week of 28 Sep", value: "72K" },
      change: "−40%",
      supporting: ["The decline is steady (about 6% a week), not a one-off drop or a tracking break."],
      contradicting: [],
      unknowns: ["Whether the decline has started to level off."],
    },
    trail: [
      { text: "Loaded weekly DAU, 29 Jun – 28 Sep 2026.", evidenceId: "ev-dau" },
      { text: "June and July are flat at 118K–121K, so early August is a fair baseline." },
      { text: "The week of 28 Sep averages 72K: 40% below the week of 3 Aug." },
    ],
  },
  {
    id: "f-activation",
    investigationId: inv,
    kind: "observation",
    statement: "New-user activation dropped 31%.",
    confidence: "high",
    confidenceReason: "Direct funnel measurement; the drop is large and consistent.",
    evidenceIds: ["ev-activation"],
    detail: {
      metricLabel: "New users activated within 7 days",
      before: { label: "Before 4 Aug", value: "42%" },
      after: { label: "Late Sep", value: "29%" },
      change: "−31%",
      supporting: ["Signup volume held steady (+4%), so fewer users are activating, not fewer arriving."],
      contradicting: [],
      unknowns: ["Which step of onboarding loses them."],
    },
    trail: [
      { text: "Loaded the new-user activation funnel, 1 Aug – 30 Sep 2026.", evidenceId: "ev-activation" },
      { text: "Activation averaged 42% for signups before 4 Aug and 29% by late September." },
      { text: "(42 − 29) / 42 = a 31% relative drop." },
    ],
  },
  {
    id: "f-retention",
    investigationId: inv,
    kind: "observation",
    statement: "Existing-user retention has remained relatively stable.",
    confidence: "high",
    confidenceReason: "Cohort data covers all users active for 30+ days.",
    evidenceIds: ["ev-cohorts"],
    detail: {
      metricLabel: "Existing-user 4-week retention",
      before: { label: "June cohort", value: "81%" },
      after: { label: "August cohort", value: "79%" },
      change: "−2 pts",
      supporting: ["Core feature usage by existing merchants hasn't changed."],
      contradicting: [],
      unknowns: [],
    },
    trail: [
      { text: "Compared 4-week retention for users active 30+ days, June to August.", evidenceId: "ev-cohorts" },
      { text: "Retention moved from 81% to 79%, within normal monthly variation." },
    ],
  },
  {
    id: "f-timing",
    investigationId: inv,
    kind: "observation",
    statement: "The decline began shortly after the onboarding flow changed on 4 August.",
    confidence: "high",
    confidenceReason: "Release date is documented; the trend turns the following week.",
    evidenceIds: ["ev-dau", "ev-releases"],
    trail: [
      { text: "Release 4.2 on 4 Aug moved store configuration before the first product import.", evidenceId: "ev-releases" },
      { text: "Weekly DAU was flat for five weeks before, and fell every week after.", evidenceId: "ev-dau" },
      { text: "Timing alone doesn't prove cause — see hypothesis H2 for another change in July." },
    ],
  },
  {
    id: "f-tickets",
    investigationId: inv,
    kind: "observation",
    statement: "Onboarding support tickets more than doubled after 4 August.",
    confidence: "high",
    confidenceReason: "Ticket tags are applied consistently by the support team.",
    evidenceIds: ["ev-support"],
    detail: {
      metricLabel: "Tickets tagged “onboarding” per month",
      before: { label: "July", value: "81" },
      after: { label: "September", value: "186" },
      change: "+130%",
      supporting: [],
      contradicting: [],
      unknowns: ["What the tickets are about — they haven't been analysed for themes yet."],
    },
    trail: [{ text: "Counted tickets tagged onboarding per month, June – September.", evidenceId: "ev-support" }],
  },
  {
    id: "f-mix",
    investigationId: inv,
    kind: "observation",
    statement: "Paid search's share of new signups rose from 31% to 49% after a July budget increase.",
    confidence: "high",
    confidenceReason: "Lead source is recorded for every signup in the CRM.",
    evidenceIds: ["ev-channels"],
    detail: {
      metricLabel: "Share of new signups from paid search",
      before: { label: "June", value: "31%" },
      after: { label: "August", value: "49%" },
      change: "+18 pts",
      supporting: [],
      contradicting: [],
      unknowns: ["Whether paid-search users activate less than others."],
    },
    trail: [{ text: "Compared lead-source mix for new signups in June and August.", evidenceId: "ev-channels" }],
  },
  {
    id: "f-orders",
    investigationId: inv,
    kind: "observation",
    statement: "First orders through newly launched stores fell 24%.",
    confidence: "high",
    confidenceReason: "Order records come straight from the ERP.",
    evidenceIds: ["ev-erp"],
    detail: {
      metricLabel: "First orders from stores launched in the last 30 days",
      before: { label: "July", value: "1,840" },
      after: { label: "September", value: "1,398" },
      change: "−24%",
      supporting: ["This is the business consequence: fewer activated merchants means fewer stores taking orders."],
      contradicting: [],
      unknowns: [],
    },
    trail: [{ text: "Counted first orders from stores launched within 30 days, by month.", evidenceId: "ev-erp" }],
  },
  // Interpretations — what the evidence may indicate
  {
    id: "f-int-newusers",
    investigationId: inv,
    kind: "interpretation",
    statement: "The DAU decline is driven by new users not activating, rather than existing users leaving.",
    confidence: "medium-high",
    confidenceReason: "Activation fell sharply while existing-user retention held; together they explain most of the drop.",
    evidenceIds: ["ev-activation", "ev-cohorts"],
    basedOnFindingIds: ["f-activation", "f-retention", "f-dau"],
    trail: [
      { text: "Existing users are retained as before.", evidenceId: "ev-cohorts" },
      { text: "Far fewer new users activate, so fewer join the active base each week.", evidenceId: "ev-activation" },
      { text: "That pattern would produce a gradual, weekly decline — which is what DAU shows.", evidenceId: "ev-dau" },
    ],
  },
  {
    id: "f-int-onboarding",
    investigationId: inv,
    kind: "interpretation",
    statement: "The onboarding experience may be contributing to the DAU decline.",
    confidence: "medium",
    confidenceReason: "Timing and support tickets point to onboarding, but the channel-mix change hasn't been ruled out.",
    evidenceIds: ["ev-activation", "ev-releases", "ev-support"],
    basedOnFindingIds: ["f-activation", "f-timing", "f-tickets"],
    trail: [
      { text: "Activation fell right after the onboarding change.", evidenceId: "ev-releases" },
      { text: "Onboarding tickets more than doubled in the same period.", evidenceId: "ev-support" },
      { text: "But paid search also grew in July, which could lower activation too.", evidenceId: "ev-channels" },
    ],
  },
  // Insight — a pattern across several sources
  {
    id: "f-insight",
    investigationId: inv,
    kind: "insight",
    statement: "Analytics, support tickets and ERP orders all change in the same week as the onboarding release.",
    confidence: "medium-high",
    confidenceReason: "Three independent systems agree on timing.",
    evidenceIds: ["ev-activation", "ev-support", "ev-erp"],
    basedOnFindingIds: ["f-timing", "f-tickets", "f-orders"],
    trail: [
      { text: "Product analytics: activation turns down the week of 10 Aug.", evidenceId: "ev-activation" },
      { text: "Support: onboarding tickets jump in August.", evidenceId: "ev-support" },
      { text: "ERP: first orders from new stores fall from August.", evidenceId: "ev-erp" },
    ],
  },
];

export const dauOpenQuestions: OpenQuestion[] = [
  { id: "oq-why", investigationId: inv, question: "Why are new users failing to activate?", whyItMatters: "The data shows where users stop, not why.", researchTaskId: "r-interviews" },
  { id: "oq-primary", investigationId: inv, question: "Is onboarding the primary cause?", whyItMatters: "Paid search grew at almost the same time.", researchTaskId: "r-compare" },
  { id: "oq-channel", investigationId: inv, question: "Is a specific acquisition channel contributing?", whyItMatters: "If activation fell mainly in paid search, the problem is acquisition quality.", researchTaskId: "r-channel" },
  { id: "oq-step", investigationId: inv, question: "Which onboarding step loses the most new users?", whyItMatters: "Tells us exactly where the friction is.", researchTaskId: "r-compare" },
];

export const dauHypotheses: Hypothesis[] = [
  {
    id: "h-onboarding",
    investigationId: inv,
    label: "H1",
    statement: "Onboarding friction is reducing activation.",
    confidence: "high",
    evidenceStrength: "strong",
    rationale: "Activation fell right after the onboarding change, onboarding tickets doubled, and existing users are unaffected.",
    supportingFindingIds: ["f-activation", "f-timing", "f-tickets", "f-insight"],
    contradictingFindingIds: [],
    openQuestions: ["Which step creates the friction?", "Does it affect all merchant types equally?"],
    validationMethod: "Usability interviews with 8 recently acquired users, plus a before/after comparison of onboarding steps.",
  },
  {
    id: "h-channel",
    investigationId: inv,
    label: "H2",
    statement: "A recent acquisition-channel mix change brought lower-intent users.",
    confidence: "medium",
    evidenceStrength: "moderate",
    rationale: "Paid search grew from 31% to 49% of signups in July; paid-search users have historically activated less.",
    supportingFindingIds: ["f-mix"],
    contradictingFindingIds: [],
    openQuestions: ["Did activation fall only in paid search, or in every channel?"],
    validationMethod: "Compare activation by acquisition channel before and after 4 August.",
  },
  {
    id: "h-competitor",
    investigationId: inv,
    label: "H3",
    statement: "Competitor changes are pulling users away.",
    confidence: "low",
    evidenceStrength: "weak",
    rationale: "No internal evidence points here, but market context hasn't been checked yet.",
    supportingFindingIds: [],
    contradictingFindingIds: ["f-retention"],
    openQuestions: ["Have competitors changed onboarding or pricing since July?"],
    validationMethod: "Competitor research (public), plus win/loss notes in the CRM.",
  },
];

export const dauResearchTasks: ResearchTask[] = [
  {
    id: "r-channel",
    investigationId: inv,
    title: "Analyze activation by acquisition channel",
    question: "Is the decline concentrated in a specific acquisition channel?",
    method: "Analytics",
    priority: "high",
    status: "not-started",
    runnable: true,
  },
  {
    id: "r-interviews",
    investigationId: inv,
    title: "Interview 5–8 recently acquired users",
    question: "Why are users failing to activate?",
    method: "Customer interviews",
    priority: "high",
    status: "not-started",
    runnable: false,
  },
  {
    id: "r-compare",
    investigationId: inv,
    title: "Compare onboarding behavior before and after release",
    question: "Did the onboarding change materially alter behavior?",
    method: "Product analytics",
    priority: "high",
    status: "not-started",
    runnable: true,
  },
  {
    id: "r-competitors",
    investigationId: inv,
    title: "Review competitor onboarding and pricing changes",
    question: "Are competitors pulling users away?",
    method: "Competitor research",
    priority: "low",
    status: "not-started",
    runnable: true,
  },
];

const customers: CustomerUnderstanding = {
  segments: [
    { name: "New merchants (first 30 days)", description: "Mostly single-store retailers trialling Acme Commerce.", metric: "Activation 29% (was 42%)" },
    { name: "Established merchants", description: "Active for more than 30 days; most are multi-store.", metric: "4-week retention 79% (was 81%)" },
  ],
  themes: [],
  tools: [
    { id: "t-segments", name: "Segments", status: "used", reason: "Splitting new from established merchants showed where the decline sits." },
    { id: "t-feedback", name: "Feedback themes", status: "recommended", reason: "Support tickets and in-app feedback haven't been analysed for themes yet." },
    { id: "t-interviews", name: "Interview insights", status: "recommended", reason: "No interviews yet. 5–8 interviews with recently acquired users would explain why activation fell." },
    { id: "t-journey", name: "User journey", status: "later", reason: "Map the onboarding journey after interviews, using what users actually did." },
    { id: "t-personas", name: "Personas", status: "later", reason: "Based on current evidence, Veyra recommends customer interviews before creating personas." },
    { id: "t-jtbd", name: "Jobs To Be Done", status: "not-relevant", reason: "The job — getting a store live and selling — is well understood. The question is what blocks it." },
    { id: "t-stp", name: "Segmentation & targeting (STP)", status: "not-relevant", reason: "This is a change in an existing product, not a new market." },
  ],
};

const problem: ProblemStatement = {
  original: "DAU dropped 40%.",
  whatEvidenceSuggests:
    "The original framing may be too broad. Existing users are behaving as before; the decline comes from new users who never reach activation.",
  refined:
    "Newly acquired users are failing to reach activation after the onboarding change, contributing disproportionately to the recent DAU decline.",
  whoIsAffected: "New users — mostly single-store retailers in their first 30 days",
  tryingTo: "Reach first meaningful product value: a live store with products they can sell",
  inTheWay: "Potential onboarding friction — configuration steps now come before the first product import",
  consequence: "Reduced activation, fewer first orders (−24%) and lower downstream engagement",
  confidence: "medium",
  findingIds: ["f-activation", "f-retention", "f-timing", "f-int-newusers", "f-orders"],
};

const opportunities: Opportunity[] = [
  {
    id: "op-activation",
    investigationId: inv,
    title: "Improve first-session activation",
    description: "Help new merchants reach first value — a live store with products — in their first session.",
    evidenceStrength: "strong",
    impact: "high",
    confidence: "medium",
    assessment: [
      { criterion: "Impact", rating: "High", reasoning: "Recovering activation to 42% would restore most of the lost DAU within a quarter." },
      { criterion: "Evidence strength", rating: "Strong", reasoning: "Activation, support and ERP data all point here." },
      { criterion: "Confidence", rating: "Medium", reasoning: "We know where users stop, not yet why." },
      { criterion: "Effort", rating: "Medium", reasoning: "Depends on the solution; the onboarding flow is owned by one team." },
      { criterion: "Strategic alignment", rating: "High", reasoning: "“Improve onboarding” is a current strategic priority." },
      { criterion: "Customer value", rating: "High", reasoning: "New merchants reach revenue sooner." },
    ],
    ideas: [
      {
        id: "i-simplify",
        title: "Simplify onboarding",
        problemAddressed: "Configuration steps before the first product import",
        evidence: "2025 learning: deferring configuration raised activation 12%.",
        expectedImpact: "high",
        assumptions: ["The new configuration steps are the main source of friction."],
        risks: ["Merchants may launch with incomplete payment or shipping settings."],
      },
      {
        id: "i-guided",
        title: "Add guided setup",
        problemAddressed: "New users unsure what to do next",
        evidence: "Onboarding tickets doubled after 4 Aug.",
        expectedImpact: "medium",
        assumptions: ["Users would follow a checklist if they had one."],
        risks: ["Adds steps rather than removing them."],
      },
      {
        id: "i-first-value",
        title: "Improve the first-value experience",
        problemAddressed: "Time before a merchant sees their store working",
        evidence: "First orders from new stores fell 24%.",
        expectedImpact: "high",
        assumptions: ["Seeing a live store early motivates finishing setup."],
        risks: ["May need changes across several teams."],
      },
      {
        id: "i-personalise",
        title: "Personalize onboarding by use case",
        problemAddressed: "One flow for very different merchants",
        evidence: "Most new merchants are single-store; the flow was designed for mid-market.",
        expectedImpact: "medium",
        assumptions: ["Use cases can be detected reliably at signup."],
        risks: ["More flows to build and maintain."],
      },
    ],
  },
  {
    id: "op-acquisition",
    investigationId: inv,
    title: "Improve acquisition quality",
    description: "Bring in merchants who are more likely to activate, if the channel mix is part of the problem.",
    evidenceStrength: "moderate",
    impact: "medium",
    confidence: "low",
    assessment: [
      { criterion: "Impact", rating: "Medium", reasoning: "Only matters if paid-search users activate much less." },
      { criterion: "Evidence strength", rating: "Moderate", reasoning: "The mix changed, but activation by channel is unknown." },
      { criterion: "Confidence", rating: "Low", reasoning: "H2 hasn't been tested." },
      { criterion: "Effort", rating: "Low", reasoning: "Budget and targeting changes are quick." },
      { criterion: "Strategic alignment", rating: "Medium", reasoning: "Supports growth, not a named priority." },
      { criterion: "Customer value", rating: "Low", reasoning: "Changes who arrives, not their experience." },
    ],
    ideas: [],
  },
  {
    id: "op-complexity",
    investigationId: inv,
    title: "Reduce onboarding complexity",
    description: "Cut the number of decisions a new merchant must make before their store works.",
    evidenceStrength: "moderate",
    impact: "high",
    confidence: "medium",
    assessment: [
      { criterion: "Impact", rating: "High", reasoning: "Complexity affects every new merchant." },
      { criterion: "Evidence strength", rating: "Moderate", reasoning: "Tickets suggest it; interviews would confirm." },
      { criterion: "Confidence", rating: "Medium", reasoning: "Consistent with the 2025 learning about configuration." },
      { criterion: "Effort", rating: "Medium", reasoning: "Mostly within the onboarding team." },
      { criterion: "Strategic alignment", rating: "High", reasoning: "“Improve onboarding” is a current priority." },
      { criterion: "Customer value", rating: "High", reasoning: "Less time spent on setup." },
    ],
    ideas: [],
  },
];

const nextStep: NextStep = {
  id: "ns-validate",
  investigationId: inv,
  type: "research",
  title: "Validate the onboarding hypothesis before exploring solutions",
  detail: "Analyze activation by acquisition channel, and interview 5–8 recently acquired users.",
  why: "These answer the two biggest open questions — whether onboarding is the main cause, and why new users stall. Both take days, not weeks.",
  whyNotBuildYet:
    "The refined problem has medium confidence and H2 (the channel-mix change) hasn't been ruled out. Redesigning onboarding now could solve the wrong problem.",
  researchTaskIds: ["r-channel", "r-interviews"],
  wouldChangeIf: [
    "If activation fell mainly in paid search, acquisition quality becomes the lead problem.",
    "If interviewed users leave for reasons unrelated to onboarding.",
  ],
  confidence: "medium-high",
  alternatives: [
    {
      type: "solution-exploration",
      title: "Proceed to solution exploration for “Improve first-session activation”",
      why: "Reasonable if speed matters more than certainty — H1 already has strong evidence.",
    },
    {
      type: "research",
      title: "Research competitor onboarding",
      why: "Useful context, but internal evidence doesn't point to competitors.",
    },
    {
      type: "hold",
      title: "Don't prioritise acquisition-quality work yet",
      why: "Evidence for H2 is moderate and untested.",
    },
  ],
};

const validations: ValidationPlan[] = [
  {
    id: "v-h1",
    investigationId: inv,
    hypothesisId: "h-onboarding",
    belief: "Onboarding friction is reducing activation among newly acquired users.",
    supportedBy: ["Activation fell 42% → 29% right after the 4 Aug change", "Onboarding tickets more than doubled"],
    wouldDisprove: "Interviewed users stall for reasons unrelated to onboarding, or activation fell just as much for users who skipped the new steps.",
    test: "Usability interviews with 8 recently acquired users.",
    successSignal: "At least 5 of 8 users encounter the same onboarding friction.",
    metric: "New-user activation (currently 29%; 42% before the change)",
    status: "not-started",
  },
  {
    id: "v-h2",
    investigationId: inv,
    hypothesisId: "h-channel",
    belief: "The shift to paid search brought users who are less likely to activate.",
    supportedBy: ["Paid search share rose from 31% to 49%"],
    wouldDisprove: "Activation fell by a similar amount in every channel.",
    test: "Compare activation by channel for signups before and after 4 Aug.",
    successSignal: "Paid-search activation fell at least twice as much as other channels.",
    metric: "Activation rate by acquisition channel",
    status: "not-started",
  },
  {
    id: "v-h3",
    investigationId: inv,
    hypothesisId: "h-competitor",
    belief: "Competitor changes are drawing users away.",
    supportedBy: [],
    wouldDisprove: "No major competitor change since July, and existing users keep staying.",
    test: "Review competitor releases and pricing since July; check CRM loss reasons.",
    successSignal: "A major competitor change coincides with early August.",
    metric: "Loss reasons citing competitors in the CRM",
    status: "not-started",
  },
];

function buildConversation(): ChatMessage[] {
  return [
    {
      id: "m1",
      role: "assistant",
      text: "I've investigated Product Analytics, CRM, ERP, Support and in-app feedback. The strongest signal: new-user activation fell 31% after the onboarding change, while existing-user retention held steady.",
      refs: [
        { kind: "finding", id: "f-activation", label: "View observation" },
        { kind: "hypothesis", id: "h-onboarding", label: "View H1" },
      ],
      createdAt: ago({ hours: 2 }),
    },
  ];
}

export function buildDauWorkspace(evidence: EvidenceItem[]): InvestigationWorkspace {
  return {
    investigation: {
      id: inv,
      title: "DAU Decline",
      topic: "engagement",
      status: "investigating",
      problem: "DAU has fallen 40% over the last 8 weeks.",
      subtitle: "Understand why daily active users fell, and what problem sits behind it, before deciding what to build.",
      trigger: "metric-changed",
      outcome: "understand-change",
      evidenceCount: evidence.length,
      hypothesisCount: dauHypotheses.length,
      openQuestionCount: dauOpenQuestions.length,
      confidence: "medium",
      createdAt: "2026-09-14T09:30:00Z",
      updatedAt: ago({ hours: 2 }),
    },
    stages,
    plan: dauPlan,
    questions: demoQuestions.map((q) => ({ ...q, investigationId: inv })),
    kpis,
    trend: { title: "Daily active users", metric: "Daily active users", unit: "K", points: trend, sourceEvidenceId: "ev-dau" },
    rates: {
      title: "Activation vs retention",
      primaryLabel: "New-user activation",
      secondaryLabel: "Existing-user retention",
      points: rates,
      sourceEvidenceId: "ev-activation",
    },
    map,
    evidence,
    findings: dauFindings,
    openQuestions: dauOpenQuestions,
    hypotheses: dauHypotheses,
    researchTasks: dauResearchTasks,
    customers,
    market: {
      status: "in-progress",
      summary:
        "Internal evidence explains most of the change so far. Competitor and market research would help rule out H3, but it's secondary here.",
    },
    problem,
    opportunities,
    nextStep,
    validations,
    relatedMemory: mockMemory.filter((m) => m.id === "mem-config" || m.id === "mem-rejected-pricing"),
    conversation: buildConversation(),
    proposals: [],
    notes: [
      { id: "n1", investigationId: inv, author: "Priya Shah", text: "Check whether the drop differs between mobile and desktop signups.", createdAt: ago({ hours: 3 }) },
      { id: "n2", investigationId: inv, author: "Marcus Lee", text: "Marketing says paid search targeting was broadened in July, not just the budget.", createdAt: ago({ days: 1 }) },
    ],
  };
}

/** Simulated results for each validation, returned when the team asks for results. */
export const validationResults: Record<string, ValidationResult> = {
  "v-h1": {
    summary: "7 of 8 recently acquired merchants stalled at the payment and shipping steps added on 4 Aug, before ever seeing their store.",
    details: [
      "7 of 8 interviewees got stuck on payment and shipping configuration; 5 said they planned to “finish setup later” and none had.",
      "Before/after comparison: 61% of new merchants now drop at the configuration step, up from 18% before 4 Aug.",
      "Merchants who skipped configuration (support-assisted) activated at 44% — the pre-change rate.",
    ],
    signalMet: true,
    signal: "7 of 8 users hit the same friction (target: at least 5 of 8).",
    suggestedOutcome: "confirmed",
    answers: ["oq-why", "oq-primary", "oq-step"],
  },
  "v-h2": {
    summary: "Activation fell in every acquisition channel by a similar amount, so the channel mix doesn't explain the decline.",
    details: [
      "Paid search activation fell 36%; organic fell 27%; partners fell 27%.",
      "Re-weighting signups to the July channel mix recovers only 2 points of activation.",
    ],
    signalMet: false,
    signal: "Paid search fell 1.3× as much as other channels (target: at least 2×).",
    suggestedOutcome: "rejected",
    answers: ["oq-channel"],
  },
  "v-h3": {
    summary: "No major competitor change coincides with early August, and competitor-related loss reasons are flat.",
    details: [
      "Two competitors changed pricing in June and September — neither in the August window.",
      "3% of CRM loss reasons cite a competitor, unchanged since spring.",
    ],
    signalMet: false,
    signal: "No competitor change in the August window.",
    suggestedOutcome: "rejected",
    answers: [],
  },
};
