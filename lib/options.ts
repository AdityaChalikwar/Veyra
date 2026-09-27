import type { CompanySize, FocusArea, Industry } from "@/lib/types";

/** Fixed choice lists used by onboarding and settings. */
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

export const FOCUS_AREAS: { value: FocusArea; label: string }[] = [
  { value: "Growth", label: "Acquisition, revenue, conversion" },
  { value: "Product", label: "Engagement, adoption, activation" },
  { value: "Customers", label: "Retention, churn, satisfaction" },
  { value: "Operations", label: "Cost, efficiency, delivery" },
  { value: "Strategy", label: "Markets, pricing, positioning" },
  { value: "Other", label: "Something else" },
];
