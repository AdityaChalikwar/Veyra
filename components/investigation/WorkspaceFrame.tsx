"use client";

import { Files, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AiAssistant } from "@/components/assistant/AiAssistant";
import { AddEvidenceModal } from "@/components/evidence/AddEvidenceModal";
import { EvidenceDetail } from "@/components/evidence/EvidenceDetail";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import { askVeyra } from "@/lib/data/assistant";
import type { ChatMessage, EvidenceItem, InvestigationWorkspace } from "@/lib/types";
import { FindingDetail } from "./FindingDetail";
import { HypothesisDetail } from "./HypothesisDetail";
import {
  WorkspaceContext,
  useWorkspace,
  type DetailTarget,
  type NewEvidence,
  type SideView,
} from "./workspace-context";

const detailTitles: Record<DetailTarget["type"], string> = {
  finding: "Finding",
  hypothesis: "Hypothesis",
  evidence: "Evidence",
};

/**
 * Workspace layout and shared state. The main column sits beside a side panel
 * (Evidence & Data / Veyra AI) that is docked from `xl` and a drawer below it.
 * Detail drawers for findings, hypotheses and evidence can be opened from anywhere.
 */
export function WorkspaceFrame({ workspace: initial, children }: { workspace: InvestigationWorkspace; children: React.ReactNode }) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>(initial.evidence);
  const [messages, setMessages] = useState<ChatMessage[]>(initial.conversation);
  const [thinking, setThinking] = useState(false);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [sideView, setSideView] = useState<SideView>("evidence");
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);

  const openSide = useCallback((view: SideView) => {
    setSideView(view);
    // From xl the panel is docked, so switching its view is enough.
    if (!window.matchMedia("(min-width: 1280px)").matches) setSideDrawerOpen(true);
  }, []);

  const addEvidence = useCallback(
    (item: NewEvidence) => {
      setEvidence((list) => [
        { ...item, id: `ev-new-${Date.now()}`, investigationId: initial.investigation.id, addedAt: new Date().toISOString(), analysed: false },
        ...list,
      ]);
    },
    [initial.investigation.id],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const question: ChatMessage = { id: `u-${Date.now()}`, role: "user", text, createdAt: new Date().toISOString() };
      setMessages((m) => [...m, question]);
      setThinking(true);
      const reply = await askVeyra(initial.investigation.id, text);
      setMessages((m) => [...m, reply]);
      setThinking(false);
    },
    [initial.investigation.id],
  );

  const value = useMemo(
    () => ({
      workspace: { ...initial, evidence, conversation: messages },
      openDetail: setDetail,
      openAddEvidence: () => setAddOpen(true),
      addEvidence,
      openSide,
      sendMessage,
      assistantThinking: thinking,
      messages,
    }),
    [initial, evidence, messages, addEvidence, openSide, sendMessage, thinking],
  );

  const closeDetail = useCallback(() => setDetail(null), []);
  const closeSide = useCallback(() => setSideDrawerOpen(false), []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  return (
    <WorkspaceContext.Provider value={value}>
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_356px]">
        <div className="min-w-0 px-4 pb-12 sm:px-8">{children}</div>
        <aside aria-label="Evidence and assistant" className="sticky top-0 hidden h-screen flex-col border-l border-line bg-surface xl:flex">
          <SidePanel view={sideView} onViewChange={setSideView} />
        </aside>
      </div>

      <Drawer open={sideDrawerOpen} onClose={closeSide} title={sideView === "evidence" ? "Evidence & Data" : "Veyra AI"} width="w-[400px]">
        <div className="flex h-full flex-col">
          <SidePanel view={sideView} onViewChange={setSideView} onNavigate={closeSide} compact />
        </div>
      </Drawer>

      <Drawer open={detail !== null} onClose={closeDetail} title={detail ? detailTitles[detail.type] : ""} width="w-[460px]">
        {detail?.type === "finding" && <FindingDetail id={detail.id} />}
        {detail?.type === "hypothesis" && <HypothesisDetail id={detail.id} />}
        {detail?.type === "evidence" && <EvidenceDetail id={detail.id} />}
      </Drawer>

      <AddEvidenceModal open={addOpen} onClose={closeAdd} />
    </WorkspaceContext.Provider>
  );
}

function SidePanel({
  view,
  onViewChange,
  onNavigate,
  compact,
}: {
  view: SideView;
  onViewChange: (v: SideView) => void;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const { workspace, openDetail, openAddEvidence } = useWorkspace();
  return (
    <>
      <div className={cn("shrink-0 border-b border-line px-4 pb-3", compact ? "pt-3" : "pt-5")}>
        <div role="tablist" aria-label="Side panel" className="grid grid-cols-2 rounded-lg bg-canvas p-1">
          {(
            [
              ["evidence", "Evidence & Data", Files],
              ["assistant", "Veyra AI", Sparkles],
            ] as const
          ).map(([v, label, Icon]) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => onViewChange(v)}
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium transition-colors",
                view === v ? "bg-surface text-ink shadow-card" : "text-ink-subtle hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {view === "evidence" ? (
          <div className="flex-1 overflow-y-auto">
            <EvidencePanel
              evidence={workspace.evidence}
              onSelect={(item) => openDetail({ type: "evidence", id: item.id })}
              onAdd={openAddEvidence}
            />
          </div>
        ) : (
          <AiAssistant onNavigate={onNavigate} />
        )}
      </div>
    </>
  );
}

/** Header buttons that open the side panel on screens where it isn't docked. */
export function SidePanelToggles() {
  const { openSide, workspace } = useWorkspace();
  return (
    <div className="flex items-center gap-2 xl:hidden">
      <Button type="button" variant="secondary" size="sm" onClick={() => openSide("evidence")}>
        <Files className="h-3.5 w-3.5" /> Evidence <span className="text-ink-faint">({workspace.evidence.length})</span>
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => openSide("assistant")}>
        <Sparkles className="h-3.5 w-3.5" /> Veyra AI
      </Button>
    </div>
  );
}
