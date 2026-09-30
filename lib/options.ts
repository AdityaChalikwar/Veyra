import type { CompanySize, Industry, InvestigationOutcome, InvestigationTrigger } from "@/lib/types";

/** Fixed choice lists used by onboarding and the New Investigation flow. */
export const INDUSTRIES: Industry[] = [
  "Technology",
  "Consumer",
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Professional Services",
  "Other",
];

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: "1–10", label: "Just getting started" },
  { value: "11–50", label: "Small team" },
  { value: "51–200", label: "Growing company" },
  { value: "201–500", label: "Established business" },
  { value: "500+", label: "Large organisation" },
];

export const TRIGGERS: { value: InvestigationTrigger; label: string }[] = [
  { value: "metric-changed", label: "Business metric changed" },
  { value: "customer-feedback", label: "Customer feedback" },
  { value: "stakeholder-request", label: "Executive / stakeholder request" },
  { value: "market-opportunity", label: "Market opportunity" },
  { value: "competitive-pressure", label: "Competitive pressure" },
  { value: "product-idea", label: "Product idea" },
  { value: "other", label: "Something else" },
];

export const OUTCOMES: { value: InvestigationOutcome; label: string }[] = [
  { value: "understand-change", label: "Understand why something changed" },
  { value: "identify-customer-problem", label: "Identify a customer problem" },
  { value: "find-opportunities", label: "Find product opportunities" },
  { value: "evaluate-market", label: "Evaluate a market" },
  { value: "validate-idea", label: "Validate a product idea" },
  { value: "improve-product", label: "Improve an existing product" },
  { value: "decide-what-next", label: "Decide what to build next" },
  { value: "other", label: "Other" },
];

export const triggerLabel = (t: InvestigationTrigger) => TRIGGERS.find((x) => x.value === t)?.label ?? t;
export const outcomeLabel = (o: InvestigationOutcome) => OUTCOMES.find((x) => x.value === o)?.label ?? o;
