"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useWorkspace } from "./workspace-context";

/** Tells people when Veyra is analysing new evidence or has suggestions waiting for review. */
export function SuggestionsBanner() {
  const { workspace, openDetail } = useWorkspace();
  const analysing = workspace.evidence.filter((e) => e.analysis?.status === "analysing");
  const pending = workspace.proposals.filter((p) => p.status === "pending");

  if (analysing.length) {
    return (
      <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-2.5 text-[13px] text-ink-muted">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
        Veyra is analysing “{analysing[0].name}”{analysing.length > 1 ? ` and ${analysing.length - 1} more` : ""}…
      </p>
    );
  }
  if (!pending.length) return null;
  const first = pending[0];
  const name = workspace.evidence.find((e) => e.id === first.evidenceId)?.name ?? "new evidence";
  return (
    <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-uncertain-200 bg-uncertain-50 px-4 py-2.5">
      <p className="flex min-w-0 flex-1 items-start gap-2 text-[13px] text-ink">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-uncertain-600" />
        Veyra analysed “{name}” and suggests {pending.length === 1 ? "a change" : `${pending.length} changes`}. Nothing changes until you accept.
      </p>
      <button
        type="button"
        onClick={() => openDetail({ type: "evidence", id: first.evidenceId })}
        className="shrink-0 rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-ink shadow-card hover:bg-canvas"
      >
        Review
      </button>
    </div>
  );
}
