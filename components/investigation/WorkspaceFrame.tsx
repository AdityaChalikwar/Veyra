"use client";

import { Files, MessageSquare } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AiAssistant } from "@/components/assistant/AiAssistant";
import { AddEvidenceModal } from "@/components/evidence/AddEvidenceModal";
import { EvidenceDetail } from "@/components/evidence/EvidenceDetail";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import { askVeyra } from "@/lib/data/assistant";
import { analyseEvidence, reviewProposal } from "@/lib/data/evidence";
import { analyseExistingFeedback, runResearchTask } from "@/lib/data/research";
import { useAppState } from "@/lib/store/app-store";
import type {
  ChatMessage,
  CustomerUnderstanding,
  EvidenceItem,
  EvidenceProposal,
  Finding,
  Hypothesis,
  InvestigationNote,
  InvestigationWorkspace,
  MarketContext,
  OpenQuestion,
  ResearchTask,
  ValidationPlan,
} from "@/lib/types";
import { FindingDetail } from "./FindingDetail";
import { HypothesisDetail } from "./HypothesisDetail";
import { InterviewGuideModal } from "./InterviewGuideModal";
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

const now = () => new Date().toISOString();

/**
 * Workspace layout and shared state. The main column sits beside a side panel
 * (Evidence / Ask Veyra) that is docked from `xl` and a drawer below it.
 * Detail drawers for findings, hypotheses and evidence can be opened from anywhere.
 *
 * Everything here is local to the browser session until the backend exists.
 */
export function WorkspaceFrame({ workspace: initial, children }: { workspace: InvestigationWorkspace; children: React.ReactNode }) {
  const investigationId = initial.investigation.id;
  const { user } = useAppState();

  const [evidence, setEvidence] = useState<EvidenceItem[]>(initial.evidence);
  const [findings, setFindings] = useState<Finding[]>(initial.findings);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(initial.hypotheses);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[]>(initial.openQuestions);
  const [researchTasks, setResearchTasks] = useState<ResearchTask[]>(initial.researchTasks);
  const [customers, setCustomers] = useState<CustomerUnderstanding>(initial.customers);
  const [market, setMarket] = useState<MarketContext>(initial.market);
  const [validations, setValidations] = useState<ValidationPlan[]>(initial.validations);
  const [proposals, setProposals] = useState<EvidenceProposal[]>(initial.proposals);
  const [notes, setNotes] = useState<InvestigationNote[]>(initial.notes);
  const [messages, setMessages] = useState<ChatMessage[]>(initial.conversation);
  const [nextStepAcceptedAt, setNextStepAcceptedAt] = useState<string | null>(null);
  const [running, setRunning] = useState<Record<string, boolean>>({});

  const [thinking, setThinking] = useState(false);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [sideView, setSideView] = useState<SideView>("evidence");
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);

  const say = useCallback((text: string, refs?: ChatMessage["refs"]) => {
    setMessages((m) => [...m, { id: `a-${Date.now()}-${m.length}`, role: "assistant", text, refs, createdAt: now() }]);
  }, []);

  const openSide = useCallback((view: SideView) => {
    setSideView(view);
    // From xl the panel is docked, so switching its view is enough.
    if (!window.matchMedia("(min-width: 1280px)").matches) setSideDrawerOpen(true);
  }, []);

  // New evidence is analysed in the background. Veyra then suggests changes;
  // nothing in the investigation changes until someone accepts one.
  const addEvidence = useCallback(
    async (input: NewEvidence) => {
      const item: EvidenceItem = { ...input, id: `ev-new-${Date.now()}`, investigationId, addedAt: now(), analysis: { status: "analysing" } };
      setEvidence((list) => [item, ...list]);
      const result = await analyseEvidence(item, { findings, hypotheses });
      setEvidence((list) => list.map((e) => (e.id === item.id ? { ...e, analysis: { status: "analysed", summary: result.summary } } : e)));
      setProposals((p) => [...p, ...result.proposals]);
      say(
        result.proposals.length
          ? `I've analysed “${item.name}”. ${result.summary} I've suggested a change for you to review.`
          : `I've analysed “${item.name}”. ${result.summary}`,
        [{ kind: "evidence", id: item.id, label: result.proposals.length ? "Review suggestion" : "View evidence" }],
      );
    },
    [investigationId, findings, hypotheses, say],
  );

  // Research Veyra runs itself: results arrive as evidence and observations; links to hypotheses are suggestions.
  const runResearch = useCallback(
    async (taskId: string) => {
      setRunning((r) => ({ ...r, [taskId]: true }));
      setResearchTasks((list) => list.map((t) => (t.id === taskId ? { ...t, status: "in-progress" } : t)));
      const res = await runResearchTask(taskId);
      if (res.evidence) {
        const item: EvidenceItem = { ...res.evidence, analysis: { status: "analysed", summary: res.result } };
        setEvidence((list) => [item, ...list.filter((e) => e.id !== item.id)]);
      }
      if (res.finding) setFindings((list) => [...list.filter((f) => f.id !== res.finding!.id), res.finding!]);
      if (res.proposals.length) setProposals((p) => [...p.filter((x) => !res.proposals.some((n) => n.id === x.id)), ...res.proposals]);
      if (res.answers.length && res.finding) {
        setOpenQuestions((qs) => qs.map((q) => (res.answers.includes(q.id) ? { ...q, answeredByFindingId: res.finding!.id } : q)));
      }
      if (taskId === "r-competitors") setMarket((m) => ({ ...m, status: "done", summary: res.result }));
      setResearchTasks((list) => list.map((t) => (t.id === taskId ? { ...t, status: "done", result: res.result } : t)));
      setRunning((r) => ({ ...r, [taskId]: false }));
      say(
        `Research finished: ${res.result}${res.proposals.length ? " I've suggested how this changes the hypotheses — review before anything changes." : ""}`,
        res.evidence ? [{ kind: "evidence", id: res.evidence.id, label: res.proposals.length ? "Review suggestions" : "View evidence" }] : undefined,
      );
    },
    [say],
  );

  const analyzeFeedback = useCallback(async () => {
    setRunning((r) => ({ ...r, feedback: true }));
    const res = await analyseExistingFeedback();
    setCustomers((c) => ({
      ...c,
      themes: res.themes,
      tools: c.tools.map((t) => (t.id === "t-feedback" ? { ...t, status: "used", reason: "Support tickets and in-app feedback grouped into themes." } : t)),
    }));
    setFindings((list) => [...list.filter((f) => f.id !== res.finding.id), res.finding]);
    setEvidence((list) =>
      list.map((e) => (e.id === "ev-feedback" ? { ...e, analysis: { status: "analysed", summary: res.finding.statement } } : e)),
    );
    setProposals((p) => [...p.filter((x) => !res.proposals.some((n) => n.id === x.id)), ...res.proposals]);
    setRunning((r) => ({ ...r, feedback: false }));
    say("I've grouped 186 onboarding tickets and 412 in-app comments into themes. Most complaints are about configuration required before merchants see their store.", [
      { kind: "finding", id: res.finding.id, label: "View insight" },
      { kind: "evidence", id: "ev-feedback", label: "Review suggestion" },
    ]);
  }, [say]);

  const resolveProposal = useCallback(
    (id: string, decision: "accepted" | "dismissed") => {
      const proposal = proposals.find((p) => p.id === id);
      if (!proposal || proposal.status !== "pending") return;
      setProposals((list) => list.map((p) => (p.id === id ? { ...p, status: decision } : p)));
      void reviewProposal(id, decision);
      if (decision !== "accepted") return;
      const { action, targetId, evidenceId } = proposal;
      if (action === "supports-finding") {
        setFindings((list) => list.map((f) => (f.id === targetId ? { ...f, evidenceIds: [...f.evidenceIds, evidenceId] } : f)));
        return;
      }
      const key = action === "supports-hypothesis" ? "supportingEvidenceIds" : "contradictingEvidenceIds";
      setHypotheses((list) => list.map((h) => (h.id === targetId ? { ...h, [key]: [...(h[key] ?? []), evidenceId] } : h)));
    },
    [proposals],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text, createdAt: now() }]);
      setThinking(true);
      const reply = await askVeyra(investigationId, text);
      setMessages((m) => [...m, reply]);
      setThinking(false);
    },
    [investigationId],
  );

  const startValidation = useCallback((id: string) => {
    setValidations((list) => list.map((v) => (v.id === id ? { ...v, status: "running", startedAt: now() } : v)));
  }, []);

  const acceptNextStep = useCallback(() => setNextStepAcceptedAt(now()), []);

  const addNote = useCallback(
    (text: string) => {
      setNotes((list) => [{ id: `n-${Date.now()}`, investigationId, author: user?.name ?? "You", text, createdAt: now() }, ...list]);
    },
    [investigationId, user?.name],
  );

  const workspace = useMemo<InvestigationWorkspace>(
    () => ({
      ...initial,
      investigation: { ...initial.investigation, evidenceCount: evidence.length, openQuestionCount: openQuestions.filter((q) => !q.answeredByFindingId).length },
      evidence,
      findings,
      hypotheses,
      openQuestions,
      researchTasks,
      customers,
      market,
      validations,
      proposals,
      notes,
      conversation: messages,
    }),
    [initial, evidence, findings, hypotheses, openQuestions, researchTasks, customers, market, validations, proposals, notes, messages],
  );

  const value = useMemo(
    () => ({
      workspace,
      openDetail: setDetail,
      openAddEvidence: () => setAddOpen(true),
      addEvidence,
      openSide,
      sendMessage,
      assistantThinking: thinking,
      messages,
      resolveProposal,
      running,
      runResearch,
      analyzeFeedback,
      openInterviewGuide: () => setGuideOpen(true),
      startValidation,
      nextStepAcceptedAt,
      acceptNextStep,
      addNote,
    }),
    [workspace, addEvidence, openSide, sendMessage, thinking, messages, resolveProposal, running, runResearch, analyzeFeedback, startValidation, nextStepAcceptedAt, acceptNextStep, addNote],
  );

  const closeDetail = useCallback(() => setDetail(null), []);
  const closeSide = useCallback(() => setSideDrawerOpen(false), []);
  const closeAdd = useCallback(() => setAddOpen(false), []);
  const closeGuide = useCallback(() => setGuideOpen(false), []);

  return (
    <WorkspaceContext.Provider value={value}>
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_356px]">
        <div className="min-w-0 px-4 pb-12 sm:px-8">{children}</div>
        <aside aria-label="Evidence and assistant" className="sticky top-0 hidden h-screen flex-col border-l border-line bg-surface xl:flex">
          <SidePanel view={sideView} onViewChange={setSideView} />
        </aside>
      </div>

      <Drawer open={sideDrawerOpen} onClose={closeSide} title={sideView === "evidence" ? "Evidence" : "Ask Veyra"} width="w-[400px]">
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
      <InterviewGuideModal open={guideOpen} onClose={closeGuide} />
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
              ["evidence", "Evidence", Files],
              ["assistant", "Ask Veyra", MessageSquare],
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
        <MessageSquare className="h-3.5 w-3.5" /> Ask Veyra
      </Button>
    </div>
  );
}
