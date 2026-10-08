import type { ClarifyingQuestion, InvestigationPlan, InvestigationTrigger } from "@/lib/types";

/** The primary demo, used to pre-fill the New Investigation flow. */
export const exampleProblems = [
  "Our DAU dropped 40%.",
  "Our customers are abandoning checkout.",
  "Sales are declining in our SMB segment.",
  "We are considering entering the healthcare market.",
  "Users keep asking for bulk export.",
  "Retention fell after our latest release.",
];

/** Contextual questions (with answers) for the demo problem. */
export const demoQuestions: ClarifyingQuestion[] = [
  {
    id: "q-when",
    question: "When did the drop start, and over what period?",
    answer: "Early August. It's fallen steadily for about 8 weeks.",
    hint: "Sets the before-and-after periods Veyra compares.",
  },
  {
    id: "q-who",
    question: "Which users seem most affected?",
    answer: "Mostly new merchants who signed up recently. Long-standing customers look fine.",
    hint: "Tells Veyra which segments to break the data down by.",
  },
  {
    id: "q-changes",
    question: "What changed in the product around that time?",
    answer: "We released a new onboarding flow (release 4.2) on 4 August.",
    hint: "Releases are a common cause of sudden changes.",
  },
  {
    id: "q-acquisition",
    question: "Has anything changed in how you acquire new users?",
    answer: "Marketing increased the paid search budget in July.",
    hint: "A different mix of new users can change activation without any product change.",
  },
];

/** Starting questions for any other problem. Answers are left for the user. */
export const genericQuestions: ClarifyingQuestion[] = [
  { id: "q-when", question: "When did you first notice this?", answer: "", hint: "Sets the before-and-after periods Veyra compares." },
  { id: "q-who", question: "Who or what appears to be affected?", answer: "", hint: "Customers, segments, products, regions or channels." },
  { id: "q-changes", question: "Did anything change around that time?", answer: "", hint: "Product, pricing, marketing, team or market changes." },
  { id: "q-decision", question: "What decision will this investigation inform?", answer: "", hint: "Keeps the investigation focused on what you need to decide." },
];

/** The plan Veyra proposes for the DAU demo. */
export const dauPlan: InvestigationPlan = {
  summary:
    "A metric changed, so Veyra starts with your own data — where the decline sits and when it began — then uses customer evidence to explain why. Market research is secondary.",
  methods: [
    { id: "m-trend", name: "Trend & cohort analysis", why: "Find when the decline started and which users it affects.", uses: ["Product Analytics"], status: "done" },
    { id: "m-funnel", name: "Funnel analysis", why: "See where new users stop on the way to activation.", uses: ["Product Analytics"], status: "done" },
    { id: "m-release", name: "Release history review", why: "Check what changed in the product when the decline began.", uses: ["Internal Documents"], status: "done" },
    { id: "m-business", name: "Business impact check", why: "Measure the effect on orders, not just usage.", uses: ["ERP"], status: "done" },
    { id: "m-channels", name: "Acquisition channel analysis", why: "Check whether a different mix of new users explains the change.", uses: ["CRM"], status: "in-progress" },
    { id: "m-feedback", name: "Support & feedback analysis", why: "Hear what new users say, in their own words.", uses: ["Support", "Customer Feedback"], status: "in-progress" },
    { id: "m-interviews", name: "Customer interviews", why: "Explain why new users stall — data can't tell us that.", uses: ["Recently acquired users"], status: "planned" },
    { id: "m-competitors", name: "Competitor scan", why: "Rule out outside causes. Secondary for this problem.", uses: ["Public research"], status: "planned" },
  ],
  notUsed: [
    { name: "Segmentation, targeting & positioning (STP)", why: "This is a change in an existing product, not a new market." },
    { name: "Personas", why: "Too early — interviews should come first." },
    { name: "Jobs To Be Done", why: "The job is well understood; the question is what blocks it." },
    { name: "RICE scoring", why: "There are no solutions to rank until the problem is validated." },
  ],
};

/**
 * Plan templates by what triggered the investigation. Stand-in for the real
 * investigation planner, and shows that different problems get different methods.
 */
export const planTemplates: Record<InvestigationTrigger, InvestigationPlan> = {
  "metric-changed": {
    summary: "A metric changed, so Veyra starts with your own data to find where and when it changed, then looks for why.",
    methods: [
      { id: "m1", name: "Trend & cohort analysis", why: "Find when the change started and who it affects.", uses: ["Product Analytics"], status: "planned" },
      { id: "m2", name: "Funnel analysis", why: "See where behaviour changed.", uses: ["Product Analytics"], status: "planned" },
      { id: "m3", name: "Release & campaign history", why: "Check what changed at the same time.", uses: ["Internal Documents", "CRM"], status: "planned" },
      { id: "m4", name: "Support & feedback analysis", why: "Hear what customers say about it.", uses: ["Support", "Customer Feedback"], status: "planned" },
    ],
    notUsed: [
      { name: "STP", why: "Not a new market." },
      { name: "Personas", why: "Too early — find where the change sits first." },
    ],
  },
  "customer-feedback": {
    summary: "Customers are telling you something, so Veyra starts with what they say, then checks how widespread it is.",
    methods: [
      { id: "m1", name: "Support-ticket analysis", why: "Measure how often and for whom the issue comes up.", uses: ["Support"], status: "planned" },
      { id: "m2", name: "Workflow analysis", why: "See where the workflow breaks down.", uses: ["Product Analytics"], status: "planned" },
      { id: "m3", name: "Customer interviews", why: "Understand the problem behind the request.", uses: ["Customers"], status: "planned" },
      { id: "m4", name: "Journey mapping & pain points", why: "Place the issue in the customer's end-to-end task.", status: "planned" },
    ],
    notUsed: [
      { name: "Market sizing", why: "This is about an existing workflow, not a new market." },
      { name: "Competitor analysis", why: "Only if customers mention alternatives." },
    ],
  },
  "stakeholder-request": {
    summary: "Veyra first clarifies the question behind the request, then checks the evidence for and against it.",
    methods: [
      { id: "m1", name: "Problem framing", why: "Turn the request into a testable question.", status: "planned" },
      { id: "m2", name: "Data review", why: "See what your data already says.", uses: ["Product Analytics", "CRM"], status: "planned" },
      { id: "m3", name: "Customer evidence", why: "Check whether customers have the problem too.", uses: ["Support", "Customer Feedback"], status: "planned" },
    ],
    notUsed: [{ name: "Prioritisation scoring", why: "Nothing to prioritise until the problem is clear." }],
  },
  "market-opportunity": {
    summary: "A market question needs outside-in evidence: who the customers are, what they need, and who already serves them.",
    methods: [
      { id: "m1", name: "Market research", why: "Size the opportunity and its growth.", uses: ["Market Research", "Public research"], status: "planned" },
      { id: "m2", name: "Segmentation", why: "Find which customers to focus on.", status: "planned" },
      { id: "m3", name: "Competitor analysis", why: "See who serves them today, and how well.", uses: ["Competitor Intelligence"], status: "planned" },
      { id: "m4", name: "Customer interviews & JTBD", why: "Find unmet needs.", status: "planned" },
      { id: "m5", name: "Positioning", why: "Decide how you'd be different.", status: "planned" },
    ],
    notUsed: [{ name: "Funnel analysis", why: "There's no existing product usage to analyse yet." }],
  },
  "competitive-pressure": {
    summary: "Veyra checks whether the competitive pressure shows up in your own data before comparing offerings.",
    methods: [
      { id: "m1", name: "Win/loss analysis", why: "See where and why deals are lost.", uses: ["CRM", "Sales"], status: "planned" },
      { id: "m2", name: "Competitor analysis", why: "Compare offerings and pricing.", uses: ["Competitor Intelligence", "Public research"], status: "planned" },
      { id: "m3", name: "Customer interviews", why: "Hear why customers switch or stay.", status: "planned" },
    ],
    notUsed: [{ name: "Personas", why: "Not needed to understand switching." }],
  },
  "product-idea": {
    summary: "Before building an idea, Veyra checks that the problem behind it is real and worth solving.",
    methods: [
      { id: "m1", name: "Problem validation", why: "Confirm customers have the problem the idea solves.", status: "planned" },
      { id: "m2", name: "Customer interviews & JTBD", why: "Understand the job the idea helps with.", status: "planned" },
      { id: "m3", name: "Existing evidence review", why: "Check support, feedback and usage for signals.", uses: ["Support", "Product Analytics"], status: "planned" },
    ],
    notUsed: [{ name: "RICE scoring", why: "Score ideas only once the problem is validated." }],
  },
  other: {
    summary: "Veyra will start by clarifying the problem, then choose methods once it knows what evidence exists.",
    methods: [
      { id: "m1", name: "Problem framing", why: "Clarify what exactly needs to be understood.", status: "planned" },
      { id: "m2", name: "Evidence review", why: "See what your connected data already shows.", status: "planned" },
    ],
    notUsed: [],
  },
};
