import { ago } from "@/lib/time";
import type { EvidenceItem } from "@/lib/types";

export function buildEvidence(): EvidenceItem[] {
  return [
    { id: "ev-dau", investigationId: "dau-decline", name: "dau_data.csv", category: "company-data", source: "Product Analytics", coverage: "Jan – Aug 2026", format: "csv", addedAt: ago({ hours: 2 }) },
    { id: "ev-funnel", investigationId: "dau-decline", name: "onboarding_funnel.csv", category: "company-data", source: "Product Analytics", coverage: "Jan – Aug 2026", format: "csv", addedAt: ago({ hours: 2 }) },
    { id: "ev-acq", investigationId: "dau-decline", name: "acquisition_data.csv", category: "company-data", source: "Marketing Data", coverage: "Jan – Aug 2026", format: "csv", addedAt: ago({ days: 1 }) },
    { id: "ev-seg", investigationId: "dau-decline", name: "user_segments.csv", category: "company-data", source: "Product Analytics", coverage: "Jan – Aug 2026", format: "csv", addedAt: ago({ days: 1 }) },
    { id: "ev-churn-survey", investigationId: "customer-churn", name: "cancellation_survey.xlsx", category: "company-data", source: "Customer Research", coverage: "Mar – Sep 2026", format: "xlsx", addedAt: ago({ hours: 6 }) },
    { id: "ev-pipeline", investigationId: "sales-decline", name: "sales_pipeline_q3.csv", category: "company-data", source: "CRM Export", coverage: "Apr – Sep 2026", format: "csv", addedAt: ago({ days: 1, hours: 4 }) },
  ];
}
