import { ago } from "@/lib/time";
import type { EvidenceItem } from "@/lib/types";

export function buildEvidence(): EvidenceItem[] {
  return [
    { id: "ev-dau", investigationId: "dau-decline", name: "dau_data.csv", category: "company-data", source: "Product Analytics", coverage: "Jan – Aug 2026", format: "csv", addedAt: ago({ hours: 2 }) },
    { id: "ev-funnel", investigationId: "dau-decline", name: "onboarding_funnel.csv", category: "company-data", source: "Product Analytics", coverage: "Jan – Aug 2026", format: "csv", addedAt: ago({ hours: 2 }) },
    { id: "ev-acq", investigationId: "dau-decline", name: "acquisition_data.csv", category: "company-data", source: "Marketing Data", coverage: "Jan – Aug 2026", format: "csv", addedAt: ago({ days: 1 }) },
    { id: "ev-seg", investigationId: "dau-decline", name: "user_segments.csv", category: "company-data", source: "Product Analytics", coverage: "Jan – Aug 2026", format: "csv", addedAt: ago({ days: 1 }) },
    { id: "ev-competitors", investigationId: "dau-decline", name: "Competitor Analysis Report", category: "research", source: "Uploaded by you", format: "pdf", addedAt: ago({ days: 3 }) },
    { id: "ev-trends", investigationId: "dau-decline", name: "Mobile App Engagement Trends 2026", category: "research", source: "Industry report", format: "pdf", addedAt: ago({ days: 7 }) },
    { id: "ev-onboarding-doc", investigationId: "dau-decline", name: "Onboarding redesign — product document", category: "notes", source: "Notion link", format: "link", addedAt: ago({ days: 2 }) },
    { id: "ev-support", investigationId: "dau-decline", name: "User feedback from support tickets", category: "notes", source: "Text file", format: "text", addedAt: ago({ days: 4 }) },
    { id: "ev-churn-survey", investigationId: "customer-churn", name: "cancellation_survey.xlsx", category: "company-data", source: "Customer Research", coverage: "Mar – Sep 2026", format: "xlsx", addedAt: ago({ hours: 6 }) },
    { id: "ev-pipeline", investigationId: "sales-decline", name: "sales_pipeline_q3.csv", category: "company-data", source: "CRM Export", coverage: "Apr – Sep 2026", format: "csv", addedAt: ago({ days: 1, hours: 4 }) },
  ];
}
