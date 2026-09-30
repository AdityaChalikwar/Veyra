import { ago } from "@/lib/time";
import type { DecisionRecord } from "@/lib/types";

export function buildDecisions(): DecisionRecord[] {
  return [
    { id: "dec-1", investigationId: "customer-churn", investigationTitle: "Customer Churn", decision: "Offer a pause option before annual-plan cancellation", status: "proposed", decidedAt: ago({ hours: 5 }), owner: "Priya Shah", rationale: "Most cancellations cite a temporary reason such as travel or budget." },
    { id: "dec-2", investigationId: "dau-decline", investigationTitle: "DAU Decline", decision: "Hold paid-social spend increase until onboarding is fixed", status: "decided", decidedAt: ago({ days: 1 }), owner: "Marcus Lee", rationale: "New paid-social users aren't activating, so extra spend would be wasted until onboarding is fixed." },
    { id: "dec-3", investigationId: "pricing-analysis", investigationTitle: "Pricing Analysis", decision: "Raise annual-plan discount from 15% to 20%", status: "validated", decidedAt: "2026-08-14T12:00:00Z", owner: "Elena Ruiz", rationale: "Customers compared our annual price with competitors' 20% discounts.", outcome: "Annual-plan conversion +6% in a 4-week A/B test." },
    { id: "dec-4", investigationId: "feature-adoption", investigationTitle: "Feature Adoption", decision: "Add in-app prompts for shared playlists", status: "validated", decidedAt: "2026-07-02T12:00:00Z", owner: "Sam Okafor", rationale: "Most users never discovered shared playlists.", outcome: "Shared-playlist adoption doubled." },
  ];
}
