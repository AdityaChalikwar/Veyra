/**
 * The sample investigation: "Kitchen Returns Spike" at Northwind Home — the
 * fictional retailer behind the Demo ERP. Numbers match the Demo ERP's data
 * (lib/connectors/demo-erp/data.ts), so the sample and a real investigation
 * of the demo data tell the same story.
 *
 * Story: Kitchen products moved from Hartwell Ceramics to a cheaper supplier,
 * Quanta Homewares, on 1 June. From July, Kitchen returns nearly triple —
 * mostly defective and damaged goods — while other categories stay steady,
 * and Kitchen sales fall. Longer delivery times (H2) and a seasonal rise (H3)
 * are the competing explanations.
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
import { samplePlan, sampleQuestions } from "./new-investigation";

export const SAMPLE_ID = "kitchen-returns";
const inv = SAMPLE_ID;

const stages: DiscoveryStage[] = [
  { id: "s-problem", label: "Problem definition", status: "done" },
  { id: "s-internal", label: "Internal data analysis", status: "done" },
  { id: "s-customer", label: "Customer evidence", status: "done" },
  { id: "s-market", label: "Market context", status: "in-progress" },
  { id: "s-validation", label: "Problem validation", status: "pending" },
  { id: "s-opportunity", label: "Opportunity discovery", status: "pending" },
];

const kpis: Kpi[] = [
  { id: "kpi-returns", label: "Kitchen return rate", value: "×2.8", detail: "3.6% → 10.1% of units (Jul–Sep)", kind: "decline", icon: "funnel", sourceEvidenceId: "ev-returns" },
  { id: "kpi-sales", label: "Kitchen units sold", value: "−23%", detail: "397 a month (Mar–Jun) → 305 in Sep", kind: "decline", icon: "users", sourceEvidenceId: "ev-orders" },
  { id: "kpi-other", label: "Other categories' returns", value: "Stable", detail: "2.7%–4.5% a month since July", kind: "stable", icon: "retention", sourceEvidenceId: "ev-returns" },
  { id: "kpi-evidence", label: "Evidence", value: "8 sources", detail: "6 company data · 2 customer", kind: "neutral", icon: "evidence" },
];

// Kitchen units returned each month (Demo ERP Returns). New supplier from 1 June.
const trend: TrendPoint[] = [
  { period: "Oct", value: 10 },
  { period: "Nov", value: 14 },
  { period: "Dec", value: 22 },
  { period: "Jan", value: 17 },
  { period: "Feb", value: 17 },
  { period: "Mar", value: 21 },
  { period: "Apr", value: 18 },
  { period: "May", value: 10 },
  { period: "Jun", value: 8, annotation: "New supplier (1 Jun)" },
  { period: "Jul", value: 28 },
  { period: "Aug", value: 40 },
  { period: "Sep", value: 45 },
];

// Return rate (% of units sold that month): Kitchen against every other category.
const rates: RatePoint[] = [
  { period: "Oct", primary: 2.8, secondary: 1.9 },
  { period: "Nov", primary: 2.5, secondary: 2.9 },
  { period: "Dec", primary: 3.4, secondary: 3.5 },
  { period: "Jan", primary: 5.2, secondary: 6.0 },
  { period: "Feb", primary: 5.9, secondary: 3.8 },
  { period: "Mar", primary: 5.3, secondary: 2.8 },
  { period: "Apr", primary: 4.5, secondary: 3.7 },
  { period: "May", primary: 2.3, secondary: 2.7 },
  { period: "Jun", primary: 2.2, secondary: 3.6, annotation: "New supplier (1 Jun)" },
  { period: "Jul", primary: 6.8, secondary: 2.7 },
  { period: "Aug", primary: 9.9, secondary: 3.6 },
  { period: "Sep", primary: 14.8, secondary: 4.5 },
];

const map: InvestigationMap = {
  root: { label: "Kitchen returns", value: "×2.8" },
  branches: [
    {
      id: "supply",
      label: "Supply",
      assessment: "Leading line of enquiry",
      uncertain: true,
      children: [
        { id: "switch", label: "Supplier switch", value: "1 Jun", signal: "event" },
        { id: "cost", label: "Unit cost", value: "−19%", signal: "event" },
        { id: "lead", label: "Supplier lead time", value: "11 → 27 days", signal: "problem" },
      ],
    },
    {
      id: "quality",
      label: "Product quality",
      assessment: "Defects and damage dominate",
      uncertain: false,
      children: [
        { id: "defects", label: "Defective + damaged share", value: "18% → 73%", signal: "problem" },
        { id: "late", label: "“Late” returns", value: "Fell", signal: "stable" },
        { id: "products", label: "Which products", value: "Unknown", signal: "unknown" },
      ],
    },
    {
      id: "demand",
      label: "Demand",
      assessment: "Kitchen sales falling",
      uncertain: true,
      children: [
        { id: "kitchen-sales", label: "Kitchen units sold", value: "−23%", signal: "problem" },
        { id: "other-returns", label: "Other categories' returns", value: "Stable", signal: "stable" },
        { id: "repeat", label: "Repeat purchases", value: "Unknown", signal: "unknown" },
      ],
    },
  ],
};

export const sampleFindings: Finding[] = [
  // Observations — what the data directly shows
  {
    id: "f-returns",
    investigationId: inv,
    kind: "observation",
    statement: "Kitchen's return rate nearly tripled: 3.6% of units sold (Oct–Jun) to 10.1% (Jul–Sep), reaching 14.8% in September.",
    confidence: "high",
    confidenceReason: "Counted from every return and order line in the ERP; the rise is steady month on month.",
    evidenceIds: ["ev-returns", "ev-orders"],
    detail: {
      metricLabel: "Kitchen units returned ÷ units sold",
      before: { label: "Oct – Jun", value: "3.6%" },
      after: { label: "Jul – Sep", value: "10.1%" },
      change: "×2.8",
      supporting: ["The rate climbs every month from July: 6.8%, 9.9%, 14.8%."],
      contradicting: [],
      unknowns: ["Whether it has peaked."],
    },
    trail: [
      { text: "Counted Kitchen units returned and sold each month, Oct 2025 – Sep 2026.", evidenceId: "ev-returns" },
      { text: "October to June averaged 3.6% of units sold.", evidenceId: "ev-orders" },
      { text: "July to September averaged 10.1%, and September alone was 14.8%." },
    ],
  },
  {
    id: "f-other",
    investigationId: inv,
    kind: "observation",
    statement: "Return rates in the other four categories stayed within their usual range (2.7%–4.5% a month since July).",
    confidence: "high",
    confidenceReason: "Same data and method as the Kitchen figures.",
    evidenceIds: ["ev-returns", "ev-orders"],
    detail: {
      metricLabel: "Return rate, Bedding, Bath, Living and Lighting together",
      before: { label: "Oct – Jun", value: "1.9%–6.0%" },
      after: { label: "Jul – Sep", value: "2.7%–4.5%" },
      change: "No change",
      supporting: ["So customers aren't returning more in general — the change is specific to Kitchen."],
      contradicting: [],
      unknowns: [],
    },
    trail: [{ text: "Compared monthly return rates for every category other than Kitchen.", evidenceId: "ev-returns" }],
  },
  {
    id: "f-reasons",
    investigationId: inv,
    kind: "observation",
    statement: "Defective and damaged items made up 73% of Kitchen returns from July, up from 18% before.",
    confidence: "high",
    confidenceReason: "Reason codes are recorded on every return authorisation.",
    evidenceIds: ["ev-returns"],
    detail: {
      metricLabel: "Share of Kitchen units returned as DEFECTIVE or DAMAGED",
      before: { label: "Oct – Jun", value: "18%" },
      after: { label: "Jul – Sep", value: "73%" },
      change: "+55 pts",
      supporting: ["“Changed mind” returns, the usual top reason, fell from 77 units to 13."],
      contradicting: ["“Late” returns fell too (20 → 9), so lateness isn't showing up in returns."],
      unknowns: ["Whether faults come from manufacturing or from damage in transit."],
    },
    trail: [
      { text: "Grouped Kitchen returns by reason code, before and after 1 July.", evidenceId: "ev-returns" },
      { text: "Before: 25 of 137 units were defective or damaged. After: 82 of 113." },
    ],
  },
  {
    id: "f-supplier",
    investigationId: inv,
    kind: "observation",
    statement: "Every Kitchen purchase order moved from Hartwell Ceramics to Quanta Homewares on 1 June; the first Quanta goods arrived on 23 June.",
    confidence: "high",
    confidenceReason: "Vendor and goods-receipt dates are on every purchase order.",
    evidenceIds: ["ev-purchases", "ev-supplier"],
    trail: [
      { text: "Listed Kitchen purchase orders by vendor: Hartwell until May, Quanta from June.", evidenceId: "ev-purchases" },
      { text: "The first Quanta goods receipt is dated 23 June, so Quanta stock was on sale from late June.", evidenceId: "ev-purchases" },
      { text: "The purchasing memo gives the reason: a lower unit cost.", evidenceId: "ev-supplier" },
    ],
  },
  {
    id: "f-cost",
    investigationId: inv,
    kind: "observation",
    statement: "Quanta's unit cost is 19% lower than Hartwell's (22.90 vs 28.33 on average), but its deliveries take 27 days instead of 11.",
    confidence: "high",
    confidenceReason: "Averages over 100 Hartwell and 44 Quanta purchase orders.",
    evidenceIds: ["ev-purchases"],
    detail: {
      metricLabel: "Kitchen purchase orders, by supplier",
      before: { label: "Hartwell Ceramics", value: "28.33 · 11 days" },
      after: { label: "Quanta Homewares", value: "22.90 · 27 days" },
      change: "−19% cost",
      supporting: [],
      contradicting: [],
      unknowns: ["Whether Quanta's specification (glaze, firing, packaging) differs from Hartwell's."],
    },
    trail: [{ text: "Averaged unit cost and order-to-receipt days per supplier.", evidenceId: "ev-purchases" }],
  },
  {
    id: "f-sales",
    investigationId: inv,
    kind: "observation",
    statement: "Kitchen units sold fell from about 397 a month (March–June) to 305 in September (−23%).",
    confidence: "medium-high",
    confidenceReason: "Measured directly from order lines; one month after the fall is a short period.",
    evidenceIds: ["ev-orders"],
    detail: {
      metricLabel: "Kitchen units sold per month",
      before: { label: "Mar – Jun average", value: "397" },
      after: { label: "September", value: "305" },
      change: "−23%",
      supporting: ["Other categories didn't fall in September."],
      contradicting: [],
      unknowns: ["Whether customers who returned a Kitchen item stopped buying."],
    },
    trail: [{ text: "Counted Kitchen units sold per month from sales order lines.", evidenceId: "ev-orders" }],
  },
  {
    id: "f-refunds",
    investigationId: inv,
    kind: "observation",
    statement: "Kitchen refunds rose from 682 in June to 3,597 in September.",
    confidence: "high",
    confidenceReason: "Refund amounts are recorded on every return.",
    evidenceIds: ["ev-returns"],
    trail: [{ text: "Summed refund amounts on Kitchen returns by month.", evidenceId: "ev-returns" }],
  },
  // Interpretations — what the evidence may indicate
  {
    id: "f-int-quality",
    investigationId: inv,
    kind: "interpretation",
    statement: "The rise in returns is specific to Kitchen goods from the new supplier, not a general change in how customers return.",
    confidence: "medium-high",
    confidenceReason: "Only Kitchen changed, the change is in defect and damage reasons, and it starts when Quanta stock went on sale.",
    evidenceIds: ["ev-returns", "ev-purchases"],
    basedOnFindingIds: ["f-returns", "f-other", "f-reasons", "f-supplier"],
    trail: [
      { text: "Other categories' returns are unchanged.", evidenceId: "ev-returns" },
      { text: "Kitchen returns turned into defect and damage returns.", evidenceId: "ev-returns" },
      { text: "That begins the month after Quanta's first goods arrived.", evidenceId: "ev-purchases" },
    ],
  },
  {
    id: "f-int-sales",
    investigationId: inv,
    kind: "interpretation",
    statement: "Faulty goods may be putting customers off buying Kitchen products again.",
    confidence: "medium",
    confidenceReason: "Sales fell after returns rose, but repeat purchases haven't been measured directly.",
    evidenceIds: ["ev-orders", "ev-returns"],
    basedOnFindingIds: ["f-sales", "f-returns"],
    trail: [
      { text: "Kitchen sales fell in September, two months into the returns rise.", evidenceId: "ev-orders" },
      { text: "Nothing else in the data explains a Kitchen-only fall." },
    ],
  },
  // Insight — a pattern across several sources
  {
    id: "f-insight",
    investigationId: inv,
    kind: "insight",
    statement: "Purchasing, returns and sales tell one story in sequence: cheaper goods arrive in June, defect returns climb from July, Kitchen sales fall by September.",
    confidence: "medium-high",
    confidenceReason: "Three independent datasets agree on order and timing.",
    evidenceIds: ["ev-purchases", "ev-returns", "ev-orders"],
    basedOnFindingIds: ["f-supplier", "f-reasons", "f-sales"],
    trail: [
      { text: "Purchasing: Quanta's first goods received on 23 June.", evidenceId: "ev-purchases" },
      { text: "Returns: defective and damaged Kitchen returns climb from July.", evidenceId: "ev-returns" },
      { text: "Sales: Kitchen units sold fall 23% by September.", evidenceId: "ev-orders" },
    ],
  },
];

export const sampleOpenQuestions: OpenQuestion[] = [
  { id: "oq-which", investigationId: inv, question: "Which Kitchen products drive the defect returns?", whyItMatters: "Tells us whether it's every Quanta product or a few lines.", researchTaskId: "r-products" },
  { id: "oq-cause", investigationId: inv, question: "Are the faults from manufacturing, or from damage in transit?", whyItMatters: "Points to the supplier's quality or to packaging and handling.", researchTaskId: "r-interviews" },
  { id: "oq-supplier", investigationId: inv, question: "Are defects really concentrated in Quanta's batches?", whyItMatters: "Timing suggests it; batch data would show it.", researchTaskId: "r-compare" },
  { id: "oq-customers", investigationId: inv, question: "Do customers who return a Kitchen item stop buying from Northwind?", whyItMatters: "Measures the real cost beyond refunds.", researchTaskId: "r-interviews" },
];

export const sampleHypotheses: Hypothesis[] = [
  {
    id: "h-quality",
    investigationId: inv,
    label: "H1",
    statement: "Goods from the new Kitchen supplier are lower quality, causing defect and damage returns.",
    confidence: "high",
    evidenceStrength: "strong",
    rationale: "Returns rose only in Kitchen, almost entirely as defective or damaged items, starting when Quanta stock went on sale.",
    supportingFindingIds: ["f-returns", "f-reasons", "f-supplier", "f-insight"],
    contradictingFindingIds: [],
    openQuestions: ["Which products?", "Manufacturing faults or transit damage?"],
    validationMethod: "Compare defect returns by supplier batch, and talk to 8 customers who returned a Kitchen item.",
  },
  {
    id: "h-delivery",
    investigationId: inv,
    label: "H2",
    statement: "Longer supplier lead times are causing late or damaged deliveries.",
    confidence: "medium",
    evidenceStrength: "moderate",
    rationale: "Quanta takes 27 days to deliver instead of 11 — but “late” returns fell, so lateness isn't showing up in returns.",
    supportingFindingIds: ["f-cost"],
    contradictingFindingIds: ["f-reasons"],
    openQuestions: ["Did long lead times cause Kitchen stock gaps?"],
    validationMethod: "Compare damage rates by delivery time, and check Kitchen stock levels after the switch.",
  },
  {
    id: "h-season",
    investigationId: inv,
    label: "H3",
    statement: "Customers return more in summer, across every category.",
    confidence: "low",
    evidenceStrength: "weak",
    rationale: "A common pattern in retail — but other categories' return rates didn't rise.",
    supportingFindingIds: [],
    contradictingFindingIds: ["f-other"],
    openQuestions: ["Did last summer show the same pattern?"],
    validationMethod: "Compare this summer's return rates by category with last year's.",
  },
];

export const sampleResearchTasks: ResearchTask[] = [
  {
    id: "r-products",
    investigationId: inv,
    title: "Analyze defect returns by Kitchen product",
    question: "Which Kitchen products drive the defect returns?",
    method: "Analytics",
    priority: "high",
    status: "not-started",
    runnable: true,
  },
  {
    id: "r-interviews",
    investigationId: inv,
    title: "Talk to 6–8 customers who returned a Kitchen item",
    question: "What was wrong with the item, and will they buy again?",
    method: "Customer interviews",
    priority: "high",
    status: "not-started",
    runnable: false,
  },
  {
    id: "r-compare",
    investigationId: inv,
    title: "Compare defect returns by supplier batch",
    question: "Are defects concentrated in Quanta's batches?",
    method: "Product analytics",
    priority: "high",
    status: "not-started",
    runnable: true,
  },
  {
    id: "r-competitors",
    investigationId: inv,
    title: "Review competitors' kitchenware reviews and pricing",
    question: "Do budget ceramics have a known quality problem across the market?",
    method: "Competitor research",
    priority: "low",
    status: "not-started",
    runnable: true,
  },
];

const customers: CustomerUnderstanding = {
  segments: [
    { name: "Household customers", description: "Most Northwind customers; buy for their own homes.", metric: "88% of customers" },
    { name: "Trade customers", description: "Shops and interior designers; 15% discount and 30-day terms.", metric: "12% of customers" },
  ],
  themes: [],
  tools: [
    { id: "t-segments", name: "Segments", status: "used", reason: "Splitting returns by product category showed the change is Kitchen-only." },
    { id: "t-feedback", name: "Feedback themes", status: "recommended", reason: "Return notes and product reviews haven't been grouped into themes yet." },
    { id: "t-interviews", name: "Interview insights", status: "recommended", reason: "Talking to customers who returned Kitchen items would show what's actually wrong with them." },
    { id: "t-journey", name: "User journey", status: "later", reason: "Map delivery-to-unboxing once we know whether damage happens in transit." },
    { id: "t-personas", name: "Personas", status: "later", reason: "Not needed to explain a product-quality change." },
    { id: "t-jtbd", name: "Jobs To Be Done", status: "not-relevant", reason: "The job — kitchenware that arrives intact and lasts — is clear. The question is what's failing it." },
    { id: "t-stp", name: "Segmentation & targeting (STP)", status: "not-relevant", reason: "This is a change in an existing range, not a new market." },
  ],
};

const problem: ProblemStatement = {
  original: "Kitchen product returns have roughly tripled since July.",
  whatEvidenceSuggests:
    "This isn't a returns problem in general. Only Kitchen is affected, almost entirely through defective and damaged goods, starting when stock from a cheaper new supplier went on sale.",
  refined:
    "Customers buying Kitchen products since July are receiving more faulty or damaged goods, which drives returns and may be costing repeat sales.",
  whoIsAffected: "Customers buying Kitchen products since the first Quanta stock went on sale (late June)",
  tryingTo: "Get kitchenware that arrives intact and lasts",
  inTheWay: "Faulty or damaged items — appearing after the switch to Quanta Homewares",
  consequence: "Refunds up from 682 to 3,597 a month, and Kitchen units sold down 23%",
  confidence: "medium",
  findingIds: ["f-returns", "f-other", "f-reasons", "f-supplier", "f-sales"],
};

const opportunities: Opportunity[] = [
  {
    id: "op-quality",
    investigationId: inv,
    title: "Restore Kitchen product quality",
    description: "Make sure Kitchen goods reach customers intact and as described, whichever supplier makes them.",
    evidenceStrength: "strong",
    impact: "high",
    confidence: "medium",
    assessment: [
      { criterion: "Impact", rating: "High", reasoning: "Returning to a 3.6% return rate would save about 2,900 a month in refunds and protect Kitchen sales." },
      { criterion: "Evidence strength", rating: "Strong", reasoning: "Returns, purchasing and sales data all point here." },
      { criterion: "Confidence", rating: "Medium", reasoning: "We know when and where; not yet whether it's manufacturing or transit." },
      { criterion: "Effort", rating: "Medium", reasoning: "Depends on the fix — inspection is quick, changing supplier is not." },
      { criterion: "Strategic alignment", rating: "High", reasoning: "“Reduce product returns” and “Improve supplier reliability” are current priorities." },
      { criterion: "Customer value", rating: "High", reasoning: "Customers get what they paid for." },
    ],
    ideas: [
      {
        id: "i-inspect",
        title: "Inspect incoming Quanta goods",
        problemAddressed: "Faulty items reaching customers",
        evidence: "Defective and damaged returns rose from 18% to 73% of Kitchen returns.",
        expectedImpact: "medium",
        assumptions: ["Faults can be spotted on arrival."],
        risks: ["Adds handling cost and delays stock."],
      },
      {
        id: "i-switch-back",
        title: "Move the worst lines back to Hartwell",
        problemAddressed: "Lower-quality goods from the new supplier",
        evidence: "Hartwell's goods had a 3.6% return rate for nine months.",
        expectedImpact: "high",
        assumptions: ["A few products cause most of the defects."],
        risks: ["Gives up the 19% cost saving on those lines."],
      },
      {
        id: "i-packaging",
        title: "Improve packaging for ceramics",
        problemAddressed: "Damage in transit",
        evidence: "Damaged returns rose sharply alongside defects.",
        expectedImpact: "medium",
        assumptions: ["Some of the damage happens in transit, not in manufacturing."],
        risks: ["Doesn't help if the goods are faulty when made."],
      },
      {
        id: "i-spec",
        title: "Agree a quality standard and defect penalties with Quanta",
        problemAddressed: "No agreed quality bar with the new supplier",
        evidence: "The switch was made on price alone (purchasing memo).",
        expectedImpact: "high",
        assumptions: ["Quanta can meet the standard."],
        risks: ["Takes a negotiation cycle to land."],
      },
    ],
  },
  {
    id: "op-recovery",
    investigationId: inv,
    title: "Win back affected customers",
    description: "Keep customers who received faulty Kitchen goods from leaving for good.",
    evidenceStrength: "moderate",
    impact: "medium",
    confidence: "low",
    assessment: [
      { criterion: "Impact", rating: "Medium", reasoning: "Only matters if those customers are actually lost." },
      { criterion: "Evidence strength", rating: "Moderate", reasoning: "Sales fell, but repeat purchases aren't measured yet." },
      { criterion: "Confidence", rating: "Low", reasoning: "Interviews would tell us." },
      { criterion: "Effort", rating: "Low", reasoning: "Outreach and an offer are quick to set up." },
      { criterion: "Strategic alignment", rating: "High", reasoning: "“Grow repeat purchases” is a business goal." },
      { criterion: "Customer value", rating: "Medium", reasoning: "Makes up for a bad experience." },
    ],
    ideas: [],
  },
  {
    id: "op-sourcing",
    investigationId: inv,
    title: "Make supplier changes safer",
    description: "Catch quality problems before a new supplier's goods reach every customer.",
    evidenceStrength: "moderate",
    impact: "high",
    confidence: "medium",
    assessment: [
      { criterion: "Impact", rating: "High", reasoning: "Prevents the next switch from repeating this." },
      { criterion: "Evidence strength", rating: "Moderate", reasoning: "Also seen with the 2025 towel supplier (Business Memory)." },
      { criterion: "Confidence", rating: "Medium", reasoning: "Pattern is consistent across two switches." },
      { criterion: "Effort", rating: "Medium", reasoning: "A process change for purchasing." },
      { criterion: "Strategic alignment", rating: "High", reasoning: "“Improve supplier reliability” is a current priority." },
      { criterion: "Customer value", rating: "Medium", reasoning: "Indirect: fewer bad experiences." },
    ],
    ideas: [],
  },
];

const nextStep: NextStep = {
  id: "ns-validate",
  investigationId: inv,
  type: "research",
  title: "Confirm the new supplier is the cause before changing suppliers",
  detail: "Break defect returns down by Kitchen product and supplier batch, and talk to 6–8 customers who returned a Kitchen item.",
  why: "These answer the biggest open questions — which products, and whether faults come from manufacturing or transit — in a few days.",
  whyNotBuildYet:
    "Switching suppliers or renegotiating has a real cost. The data points to Quanta, but it doesn't yet show which products or whether better packaging alone would fix it.",
  researchTaskIds: ["r-products", "r-interviews"],
  wouldChangeIf: [
    "If defect returns are spread evenly across Hartwell and Quanta batches.",
    "If returned items show transit damage rather than manufacturing faults.",
  ],
  confidence: "medium-high",
  alternatives: [
    {
      type: "solution-exploration",
      title: "Pause new Quanta orders for the worst lines now",
      why: "Reasonable if refunds matter more than certainty — H1 already has strong evidence.",
    },
    {
      type: "research",
      title: "Research competitors' budget kitchenware",
      why: "Useful context, but internal evidence already explains most of the change.",
    },
    {
      type: "hold",
      title: "Don't change delivery or logistics yet",
      why: "Evidence for H2 is moderate and partly contradicted.",
    },
  ],
};

const validations: ValidationPlan[] = [
  {
    id: "v-h1",
    investigationId: inv,
    hypothesisId: "h-quality",
    belief: "Goods from Quanta Homewares are lower quality, causing the defect and damage returns.",
    supportedBy: ["Kitchen returns 3.6% → 10.1% after the switch", "Defective and damaged share 18% → 73%"],
    wouldDisprove: "Defect returns are spread evenly across Hartwell and Quanta batches, or customers describe transit damage rather than faults.",
    test: "Compare defect returns by supplier batch, and talk to 8 customers who returned a Kitchen item.",
    successSignal: "Quanta batches account for at least 70% of defect returns, and at least 5 of 8 customers describe a product fault.",
    metric: "Kitchen return rate (10.1% now; 3.6% before)",
    status: "not-started",
  },
  {
    id: "v-h2",
    investigationId: inv,
    hypothesisId: "h-delivery",
    belief: "Longer supplier lead times are causing late or damaged deliveries.",
    supportedBy: ["Lead time rose from 11 to 27 days"],
    wouldDisprove: "Damage rates don't differ by delivery time.",
    test: "Compare damage returns by days from order to delivery, and check Kitchen stock levels.",
    successSignal: "Orders delivered late are damaged at least twice as often.",
    metric: "Damage return rate by delivery time",
    status: "not-started",
  },
  {
    id: "v-h3",
    investigationId: inv,
    hypothesisId: "h-season",
    belief: "Customers return more in summer across every category.",
    supportedBy: [],
    wouldDisprove: "Other categories' return rates stay flat over the summer, and last summer showed no rise.",
    test: "Compare summer return rates by category with last year's.",
    successSignal: "Every category's return rate rises by at least half.",
    metric: "Return rate by category, summer vs the rest of the year",
    status: "not-started",
  },
];

function buildConversation(): ChatMessage[] {
  return [
    {
      id: "m1",
      role: "assistant",
      text: "I've looked at Northwind's orders, returns, purchasing, products and stock, plus return notes and product reviews. The strongest signal: Kitchen's return rate nearly tripled after the switch to a new supplier, almost entirely as defective or damaged goods, while other categories stayed steady.",
      refs: [
        { kind: "finding", id: "f-reasons", label: "View observation" },
        { kind: "hypothesis", id: "h-quality", label: "View H1" },
      ],
      createdAt: ago({ hours: 2 }),
    },
  ];
}

export function buildSampleWorkspace(evidence: EvidenceItem[]): InvestigationWorkspace {
  return {
    investigation: {
      id: inv,
      title: "Kitchen Returns Spike",
      topic: "operations",
      status: "investigating",
      problem: "Kitchen product returns have roughly tripled since July.",
      subtitle: "Understand why Kitchen returns rose, and what problem sits behind it, before deciding what to change.",
      triggers: ["metric-changed", "customer-feedback"],
      outcomes: ["understand-change"],
      evidenceCount: evidence.length,
      hypothesisCount: sampleHypotheses.length,
      openQuestionCount: sampleOpenQuestions.length,
      confidence: "medium",
      createdAt: "2026-09-21T09:30:00Z",
      updatedAt: ago({ hours: 2 }),
    },
    stages,
    plan: samplePlan,
    questions: sampleQuestions.map((q) => ({ ...q, investigationId: inv })),
    kpis,
    trend: { title: "Kitchen units returned", metric: "Kitchen units returned", unit: "", points: trend, sourceEvidenceId: "ev-returns" },
    rates: {
      title: "Return rate: Kitchen vs everything else",
      primaryLabel: "Kitchen",
      secondaryLabel: "Other categories",
      points: rates,
      sourceEvidenceId: "ev-returns",
    },
    map,
    evidence,
    findings: sampleFindings,
    openQuestions: sampleOpenQuestions,
    hypotheses: sampleHypotheses,
    researchTasks: sampleResearchTasks,
    customers,
    market: {
      status: "in-progress",
      summary:
        "Internal evidence explains most of the change so far. A look at competitors' budget kitchenware would help rule out a market-wide quality issue, but it's secondary here.",
    },
    problem,
    opportunities,
    nextStep,
    validations,
    relatedMemory: mockMemory.filter((m) => m.id === "mem-towels" || m.id === "mem-rejected-free-returns"),
    conversation: buildConversation(),
    proposals: [],
    notes: [
      { id: "n1", investigationId: inv, author: "Priya Shah", text: "Ask the warehouse whether Quanta's cartons arrive with less padding than Hartwell's.", createdAt: ago({ hours: 3 }) },
      { id: "n2", investigationId: inv, author: "Marcus Lee", text: "Purchasing says the Quanta contract has no defect clause — worth knowing before we renegotiate.", createdAt: ago({ days: 1 }) },
    ],
  };
}

/** Simulated results for each validation, returned when the team asks for results. */
export const validationResults: Record<string, ValidationResult> = {
  "v-h1": {
    summary: "Quanta batches account for 81% of defective Kitchen returns, and 7 of 8 customers described chips, cracks or flaking glaze out of the box.",
    details: [
      "Defect returns per 100 units sold: Quanta batches 8.9, Hartwell batches 1.4.",
      "7 of 8 customers described a fault present on arrival; 1 described a box crushed in transit.",
      "4 of 8 said they won't buy Northwind kitchenware again until reviews improve.",
    ],
    signalMet: true,
    signal: "81% of defect returns from Quanta batches, and 7 of 8 customers described a fault (targets: 70% and 5 of 8).",
    suggestedOutcome: "confirmed",
    answers: ["oq-cause", "oq-supplier", "oq-customers"],
  },
  "v-h2": {
    summary: "Damage rates don't differ by delivery time, and “late” returns fell. Longer lead times caused Kitchen stock gaps, not returns.",
    details: [
      "Orders delivered in over 5 days were damaged at the same rate as faster ones (2.1% vs 2.0%).",
      "Kitchen was briefly low on stock in mid-July while the first Quanta orders arrived.",
    ],
    signalMet: false,
    signal: "Late deliveries damaged 1.05× as often (target: at least 2×).",
    suggestedOutcome: "rejected",
    answers: [],
  },
  "v-h3": {
    summary: "Other categories show no summer rise this year or last, so the increase is Kitchen-only.",
    details: [
      "Bedding, Bath, Living and Lighting stayed within 2.7%–4.5% from July to September.",
      "Last summer's Kitchen return rate was 3.1%.",
    ],
    signalMet: false,
    signal: "No category other than Kitchen rose (target: every category up by half).",
    suggestedOutcome: "rejected",
    answers: [],
  },
};
