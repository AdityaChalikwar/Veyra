import { ago } from "@/lib/time";
import type { InvestigationSummary } from "@/lib/types";

/** Built on each call so "updated 2 hours ago" stays true for the demo. */
export function buildInvestigations(): InvestigationSummary[] {
  return [
    {
      id: "dau-decline",
      title: "DAU Decline",
      topic: "engagement",
      status: "investigating",
      stage: "diagnosis",
      progress: 72,
      headline: "Daily active users down 40% since April. The drop is concentrated in paid-social signups.",
      updatedAt: ago({ hours: 2 }),
    },
    {
      id: "sales-decline",
      title: "Sales Decline",
      topic: "revenue",
      status: "diagnosing",
      stage: "analysis",
      progress: 45,
      headline: "Monthly sales down 25% over six months. Mid-market deals are taking longer to close.",
      updatedAt: ago({ days: 1, hours: 3 }),
    },
    {
      id: "customer-churn",
      title: "Customer Churn",
      topic: "retention",
      status: "recommendation",
      stage: "recommendation",
      progress: 85,
      headline: "Annual-plan churn up 3.2 points. A recommendation is ready for your review.",
      updatedAt: ago({ hours: 5 }),
    },
    {
      id: "new-market",
      title: "New Market Opportunity",
      topic: "market",
      status: "planning",
      stage: "setup",
      progress: 20,
      headline: "Assessing demand for a small-business tier in the UK.",
      updatedAt: ago({ days: 3 }),
    },
    {
      id: "pricing-analysis",
      title: "Pricing Analysis",
      topic: "pricing",
      status: "completed",
      stage: "action",
      progress: 100,
      headline: "Annual discount raised from 15% to 20%. Annual-plan conversion up 6%.",
      updatedAt: "2026-08-14T12:00:00Z",
    },
    {
      id: "feature-adoption",
      title: "Feature Adoption",
      topic: "adoption",
      status: "completed",
      stage: "action",
      progress: 100,
      headline: "Shared-playlist adoption doubled after adding in-app prompts.",
      updatedAt: "2026-07-02T12:00:00Z",
    },
  ];
}
