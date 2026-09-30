import type { BusinessContext, Company } from "@/lib/types";

export const mockCompany: Company = {
  id: "company_1",
  name: "Acme",
  description: "Commerce platform for mid-market retailers",
  industry: "Technology",
  size: "201–500",
};

/** Persistent business context — reused by every investigation. */
export const mockBusinessContext: BusinessContext = {
  company: "Acme",
  product: "Acme Commerce",
  businessModel: "B2B SaaS — monthly subscription per store",
  targetCustomers: "Mid-market retailers (5–200 stores); growing base of single-store retailers",
  goals: ["Increase retention", "Increase expansion revenue"],
  priorities: ["Improve onboarding", "Reduce churn", "Expand into Europe"],
  keyMetrics: ["Daily active users", "New-merchant activation", "Net revenue retention"],
};
