/**
 * Summary-level discovery artifacts for investigations other than the DAU demo,
 * so organisation-wide pages (Problems, Opportunities, Validation, Customers)
 * show more than one investigation.
 */
import type { Confidence, EvidenceStrength, Level } from "@/lib/types";

export const otherProblems: { investigationId: string; investigationTitle: string; refined: string; status: "draft" | "refined" | "validated"; confidence: Confidence }[] = [
  {
    investigationId: "smb-onboarding",
    investigationTitle: "SMB Onboarding",
    refined: "Single-store retailers can't tell which setup steps they can skip, so they stall before launching a first store.",
    status: "draft",
    confidence: "low-medium",
  },
  {
    investigationId: "inventory-conversion",
    investigationTitle: "Inventory Conversion",
    refined: "Merchants whose inventory sync fails in the first week rarely recover, and most don't contact support.",
    status: "refined",
    confidence: "medium",
  },
  {
    investigationId: "onboarding-conversion-2025",
    investigationTitle: "Onboarding Conversion Decline",
    refined: "Upfront store configuration blocked new merchants from reaching first value.",
    status: "validated",
    confidence: "high",
  },
];

export const otherOpportunities: {
  investigationId: string;
  investigationTitle: string;
  title: string;
  evidenceStrength: EvidenceStrength;
  impact: Level;
  confidence: Confidence;
}[] = [
  { investigationId: "smb-onboarding", investigationTitle: "SMB Onboarding", title: "Make optional setup steps visibly optional", evidenceStrength: "moderate", impact: "medium", confidence: "low-medium" },
  { investigationId: "inventory-conversion", investigationTitle: "Inventory Conversion", title: "Recover merchants after a failed inventory sync", evidenceStrength: "strong", impact: "high", confidence: "medium" },
];

export const otherValidations: {
  investigationId: string;
  investigationTitle: string;
  hypothesis: string;
  test: string;
  status: "not-started" | "running" | "completed";
  result?: string;
}[] = [
  {
    investigationId: "smb-onboarding",
    investigationTitle: "SMB Onboarding",
    hypothesis: "Single-store retailers stall because they can't tell which steps are optional.",
    test: "10 interviews with single-store retailers (6 done).",
    status: "running",
  },
  {
    investigationId: "onboarding-conversion-2025",
    investigationTitle: "Onboarding Conversion Decline",
    hypothesis: "Upfront configuration blocks activation.",
    test: "A/B test: defer configuration until after first product import.",
    status: "completed",
    result: "Activation +12%. Hypothesis supported.",
  },
];

export const otherOpenQuestions: { investigationId: string; investigationTitle: string; question: string }[] = [
  { investigationId: "smb-onboarding", investigationTitle: "SMB Onboarding", question: "Which setup steps do single-store retailers think are mandatory?" },
  { investigationId: "inventory-conversion", investigationTitle: "Inventory Conversion", question: "Why don't merchants contact support after a failed sync?" },
  { investigationId: "europe-expansion", investigationTitle: "Europe Expansion", question: "Do German retailers need local payment methods on day one?" },
];
