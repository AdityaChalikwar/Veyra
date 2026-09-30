"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { textareaClass } from "@/components/ui/Field";
import { formatRelative } from "@/lib/time";
import { useWorkspace } from "./workspace-context";

export function NotesView() {
  const { workspace, addNote } = useWorkspace();
  const [text, setText] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addNote(text.trim());
    setText("");
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
          <Button type="submit" size="sm" disabled={!text.trim()}>
            Add note
          </Button>
        </div>
      </form>
      <ul className="mt-4 space-y-3">
        {workspace.notes.map((n) => (
          <li key={n.id} className="rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
            <p className="text-sm leading-relaxed text-ink">{n.text}</p>
            <p className="mt-1.5 text-xs text-ink-subtle">
              {n.author} · {formatRelative(n.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
