import type { ClarifyingQuestion, InvestigationDraft } from "@/lib/types";

/** The demonstration investigation used to pre-fill the New Investigation form. */
export const demoDraft: InvestigationDraft = {
  problem: "Our DAU has fallen 40% over the last four months.",
  goal: "Identify the main causes of the decline and determine what actions could recover DAU.",
  context: {
    product: "Mobile consumer application",
    businessModel: "Freemium subscription",
    timePeriod: "April – August 2026",
  },
};

/** Questions (with answers) for the demo problem. */
export const demoQuestions: ClarifyingQuestion[] = [
  {
    id: "q-start",
    question: "When did the decline begin?",
    answer: "April 2026",
    hint: "Sets the before-and-after periods Veyra compares.",
  },
  {
    id: "q-affected",
    question: "Which users appear to be affected?",
    answer: "Mostly newly acquired users from paid social.",
    hint: "Tells Veyra which segments to break the data down by.",
  },
  {
    id: "q-changes",
    question: "Were there any major changes around this period?",
    answer: "The onboarding experience was redesigned in April.",
    hint: "Product, pricing, marketing or market changes are common causes.",
  },
  {
    id: "q-goal",
    question: "What is the primary business goal?",
    answer: "Recover DAU to previous levels.",
    hint: "Keeps the recommendation focused on the outcome you care about.",
  },
];

/** Starting questions for any other problem. Answers are left for the user. */
export const genericQuestions: ClarifyingQuestion[] = [
  { id: "q-start", question: "When did this start?", answer: "", hint: "Sets the before-and-after periods Veyra compares." },
  { id: "q-affected", question: "Who or what appears to be affected?", answer: "", hint: "Customers, segments, products, regions or channels." },
  { id: "q-changes", question: "Were there any major changes around this period?", answer: "", hint: "Product, pricing, marketing, team or market changes." },
  { id: "q-goal", question: "What is the primary business goal?", answer: "", hint: "Keeps the recommendation focused on the outcome you care about." },
];
