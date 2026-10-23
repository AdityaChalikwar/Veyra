"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { recordDecisionResult } from "@/app/(app)/investigations/decision-actions";
import { Button } from "@/components/ui/Button";
import { textareaClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";

/** Records what happened after a decision, from the Decision Log. */
export function DecisionResultForm({ decisionId }: { decisionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1 text-xs font-medium text-brand-600 hover:text-brand-700">
        Record what happened
      </button>
    );
  }
  async function save() {
    setBusy(true);
    setError(null);
    const r = await recordDecisionResult(decisionId, text).catch(() => ({ error: "Couldn't reach Veyra. Try again." }));
    setBusy(false);
    if ("error" in r) return setError(r.error);
    setOpen(false);
    router.refresh();
  }
  return (
    <div className="mt-2 space-y-2">
      <textarea className={textareaClass} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened after this decision" aria-label="What happened" />
      {error && <p className="text-xs text-danger-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={busy || !text.trim()} onClick={save}>
          {busy && <Spinner />} Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
