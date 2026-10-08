"use client";

import { createContext, useContext } from "react";
import type {
  ChatMessage,
  DiscoveryStage,
  EvidenceItem,
  EvidenceProposal,
  InvestigationStatus,
  InvestigationWorkspace,
  OpportunityChoice,
} from "@/lib/types";

export type DetailTarget = { type: "finding" | "hypothesis" | "evidence"; id: string };
export type SideView = "evidence" | "assistant";
export type NewEvidence = Pick<EvidenceItem, "name" | "category" | "source" | "format"> &
  Partial<Pick<EvidenceItem, "description" | "url" | "coverage" | "qualityNote">>;

/** Where the investigation is on its discovery path, derived from what the team has done. */
export type DiscoveryProgress = {
  stages: DiscoveryStage[];
  /** The stage in progress, or null once every stage is done. */
  current: DiscoveryStage["id"] | null;
  /** A validation has confirmed a hypothesis. */
  problemValidated: boolean;
  /** An opportunity has been chosen: the report is final. */
  complete: boolean;
  /** Every validation came back rejected — back to research. */
  allRejected: boolean;
  status: InvestigationStatus;
};

export type WorkspaceContextValue = {
  /** Workspace data, reflecting everything done in this session. */
  workspace: InvestigationWorkspace;
  /** Open the detail drawer for a finding, hypothesis or piece of evidence. */
  openDetail: (target: DetailTarget) => void;
  openAddEvidence: () => void;
  addEvidence: (item: NewEvidence) => void | Promise<void>;
  /** Below xl: open the side drawer on evidence or the assistant. */
  openSide: (view: SideView) => void;
  sendMessage: (text: string) => void;
  assistantThinking: boolean;
  messages: ChatMessage[];
  /** Accept or dismiss a change Veyra suggested after new evidence or research. */
  resolveProposal: (id: string, decision: Exclude<EvidenceProposal["status"], "pending">) => void;
  /** Research runs in progress, by task id (or "feedback" / "market"). */
  running: Record<string, boolean>;
  runResearch: (taskId: string) => void;
  analyzeFeedback: () => void;
  openInterviewGuide: () => void;
  startValidation: (validationId: string) => void;
  /** Set once the team accepts the recommended next step. */
  nextStepAcceptedAt: string | null;
  acceptNextStep: () => void;
  /** Collect results for a running validation (simulated in the preview). */
  fetchValidationResult: (validationId: string) => void;
  /** The team's verdict on a validation. Confirming one validates the problem. */
  recordValidationOutcome: (validationId: string, outcome: "confirmed" | "rejected") => void;
  /** The opportunity the team chose to pursue, once the problem is validated. */
  choice: OpportunityChoice | null;
  chooseOpportunity: (opportunityId: string) => void;
  /** Optionally, the solution direction to test first within the chosen opportunity. */
  chooseIdea: (ideaId: string) => void;
  progress: DiscoveryProgress;
  addNote: (text: string) => void;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/** For components that also render outside a workspace. */
export function useOptionalWorkspace() {
  return useContext(WorkspaceContext);
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceFrame");
  return ctx;
}
