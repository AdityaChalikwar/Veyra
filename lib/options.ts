import type { CompanySize, Industry } from "@/lib/types";

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

