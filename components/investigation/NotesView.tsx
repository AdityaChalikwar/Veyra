"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addNote as saveNote, deleteNote } from "@/app/(app)/investigations/team-actions";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { textareaClass } from "@/components/ui/Field";
import { formatRelative } from "@/lib/time";
import { ActivityTimeline } from "./ActivityTimeline";
import { useWorkspace } from "./workspace-context";

export function NotesView() {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    const r = await saveNote(workspace.investigation.id, text).catch(() => ({ error: "Couldn't reach Veyra. Try again." }));
    if ("error" in r) setError(r.error);
    else {
      setText("");
      router.refresh();
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setError(null);
    const r = await deleteNote(id).catch(() => ({ error: "Couldn't reach Veyra. Try again." }));
    if ("error" in r) setError(r.error);
    else router.refresh();
  }

  return (
    <div className="mt-6 max-w-3xl">
      <p className="mb-4 text-sm text-ink-muted">
        Team notes for this investigation. Notes aren&rsquo;t evidence — to have Veyra analyse something, add it as evidence.
      </p>
      <form onSubmit={submit} className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <label htmlFor="new-note" className="sr-only">
          New note
        </label>
        <textarea
          id="new-note"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note for the team…"
          className={textareaClass}
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" size="sm" disabled={!text.trim() || busy}>
            {busy && <Spinner />} Add note
          </Button>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger-600">
          {error}
        </p>
      )}
      {workspace.notes.length === 0 && <p className="mt-4 text-[13px] text-ink-subtle">No notes yet.</p>}
      <ul className="mt-4 space-y-3">
        {workspace.notes.map((n) => (
          <li key={n.id} className="rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
            <p className="text-sm leading-relaxed text-ink">{n.text}</p>
            <p className="mt-1.5 flex items-center justify-between text-xs text-ink-subtle">
              <span>
                {n.author} · {formatRelative(n.createdAt)}
              </span>
              <button type="button" aria-label="Delete note" onClick={() => remove(n.id)} className="text-ink-faint hover:text-danger-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </p>
          </li>
        ))}
      </ul>
      <ActivityTimeline live={workspace.live} />
    </div>
  );
}
