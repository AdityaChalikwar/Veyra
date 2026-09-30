"use client";

import { ArrowUp, Globe, Paperclip } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function ChatInput({
  onSend,
  onAttach,
  disabled,
}: {
  onSend: (text: string) => void;
  onAttach: () => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [publicResearch, setPublicResearch] = useState(false);

  function send() {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
  }

  return (
    <div className="rounded-xl border border-line bg-surface shadow-card focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-50">
      <label htmlFor="ask-veyra" className="sr-only">
        Ask Veyra
      </label>
      <textarea
        id="ask-veyra"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Ask Veyra anything..."
        className="block w-full resize-none bg-transparent px-3 pt-2.5 text-[13px] text-ink placeholder:text-ink-faint outline-none"
      />
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onAttach}
            aria-label="Add evidence"
            title="Add evidence"
            className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-canvas hover:text-ink"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPublicResearch((v) => !v)}
            aria-pressed={publicResearch}
            title="Include public research"
            className={cn(
              "flex h-7 items-center gap-1 rounded-md px-1.5 text-xs",
              publicResearch ? "bg-brand-50 text-brand-700" : "text-ink-subtle hover:bg-canvas hover:text-ink",
            )}
          >
            <Globe className="h-4 w-4" />
            {publicResearch && "Public research"}
          </button>
        </div>
        <button
          type="button"
          onClick={send}
          disabled={!text.trim() || disabled}
          aria-label="Send"
          className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:bg-line-strong"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      {publicResearch && (
        <p className="border-t border-line px-3 py-1.5 text-[11px] text-ink-faint">
          Veyra would also search public research. Not connected in this preview.
        </p>
      )}
    </div>
  );
}
