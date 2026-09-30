"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { useWorkspace } from "@/components/investigation/workspace-context";
import { suggestedPrompts } from "@/lib/data/assistant";
import { routes } from "@/lib/routes";
import type { ArtifactRef } from "@/lib/types";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

/**
 * Veyra AI. A supporting panel, not the main surface: every answer links back
 * to findings, hypotheses or the diagnosis in the investigation.
 */
export function AiAssistant({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { workspace, messages, sendMessage, assistantThinking, openDetail, openAddEvidence } = useWorkspace();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length, assistantThinking]);

  function openRef(ref: ArtifactRef) {
    if (ref.kind === "finding" || ref.kind === "hypothesis" || ref.kind === "evidence") {
      openDetail({ type: ref.kind, id: ref.id });
      return;
    }
    const tab = ref.kind === "diagnosis" ? "diagnosis" : ref.kind === "recommendation" ? "recommendations" : "action-plan";
    router.push(routes.investigation(workspace.investigation.id, tab));
    onNavigate?.();
  }

  const asked = new Set(messages.filter((m) => m.role === "user").map((m) => m.text));
  const suggestions = suggestedPrompts.filter((p) => !asked.has(p));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} onOpenRef={openRef} />
        ))}
        {assistantThinking && (
          <div className="flex items-center gap-2.5 text-xs text-ink-subtle">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-line bg-surface">
              <LogoMark className="h-4 w-4" />
            </span>
            <span className="flex gap-1" aria-label="Veyra is thinking">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t border-line bg-surface px-4 pb-4 pt-3">
        {!assistantThinking && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => sendMessage(p)}
                className="rounded-full border border-line bg-canvas px-2.5 py-1 text-left text-xs text-ink-muted hover:border-brand-300 hover:text-brand-700"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <ChatInput onSend={sendMessage} onAttach={openAddEvidence} disabled={assistantThinking} />
      </div>
    </div>
  );
}
