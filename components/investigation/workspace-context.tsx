"use client";

import { createContext, useContext } from "react";
import type { ChatMessage, EvidenceItem, EvidenceProposal, InvestigationWorkspace } from "@/lib/types";

export type DetailTarget = { type: "finding" | "hypothesis" | "evidence"; id: string };
export type SideView = "evidence" | "assistant";
export type NewEvidence = Pick<EvidenceItem, "name" | "category" | "source" | "format"> &
  Partial<Pick<EvidenceItem, "description" | "url" | "coverage">>;

export type WorkspaceContextValue = {
  /** Workspace data, with evidence and conversation reflecting local changes. */
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
  /** Accept or dismiss a change Veyra suggested after analysing new evidence. */
  resolveProposal: (id: string, decision: Exclude<EvidenceProposal["status"], "pending">) => void;
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
