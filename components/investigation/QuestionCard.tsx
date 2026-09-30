"use client";

import { HelpCircle, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { textareaClass } from "@/components/ui/Field";
import { KindBadge } from "@/components/ui/KindBadge";
import type { ClarifyingQuestion } from "@/lib/types";

type Props = {
  index: number;
  question: ClarifyingQuestion;
  onAnswerChange?: (answer: string) => void;
};

/** A clarifying question and the user's answer, editable in place. */
export function QuestionCard({ index, question, onAnswerChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(question.answer);
  const answered = question.answer.trim().length > 0;
  const fieldId = `answer-${question.id}`;

  function startEditing() {
    setValue(question.answer);
    setEditing(true);
  }

  function save() {
    onAnswerChange?.(value.trim());
    setEditing(false);
  }

  return (
    <article className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex gap-3.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-semibold text-brand-700">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug">{question.question}</h3>
          {question.hint && (
            <p className="mt-1 flex items-start gap-1.5 text-xs text-ink-subtle">
              <HelpCircle className="mt-px h-3.5 w-3.5 shrink-0" />
              {question.hint}
            </p>
          )}

          <div className="mt-3.5">
            {editing ? (
              <div>
                <label htmlFor={fieldId} className="sr-only">
                  Your answer
                </label>
                <textarea
                  id={fieldId}
                  rows={2}
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  placeholder="Type your answer, or leave it blank if you don't know."
                  className={textareaClass}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={save}>
                    Save answer
                  </Button>
                </div>
              </div>
            ) : answered ? (
              <div className="group flex items-start justify-between gap-3 rounded-lg bg-canvas px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Your answer</p>
                  <p className="mt-0.5 text-sm text-ink">{question.answer}</p>
                </div>
                {onAnswerChange && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-subtle hover:bg-white hover:text-ink"
                    aria-label={`Edit answer to: ${question.question}`}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line-strong px-3.5 py-2.5">
                <p className="flex items-center gap-2 text-[13px] text-ink-subtle">
                  <KindBadge kind="unknown" /> Not answered yet
                </p>
                {onAnswerChange && (
                  <Button type="button" variant="secondary" size="sm" onClick={startEditing}>
                    Add answer
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
