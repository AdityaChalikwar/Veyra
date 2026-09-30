"use client";

import { createContext, useContext } from "react";
import type { ChatMessage, EvidenceItem, EvidenceProposal, InvestigationWorkspace } from "@/lib/types";

export type DetailTarget = { type: "finding" | "hypothesis" | "evidence"; id: string };
export type SideView = "evidence" | "assistant";
export type NewEvidence = Pick<EvidenceItem, "name" | "category" | "source" | "format"> &
  Partial<Pick<EvidenceItem, "description" | "url" | "coverage" | "qualityNote">>;

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
