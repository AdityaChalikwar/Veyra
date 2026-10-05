"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveAnswers } from "@/app/(app)/investigations/actions";
import { Button } from "@/components/ui/Button";
import { textareaClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import type { ClarifyingQuestion } from "@/lib/types";

/** Clarifying questions with editable answers, saved together. */
export function AnswersEditor({ investigationId, questions }: { investigationId: string; questions: ClarifyingQuestion[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(questions.map((q) => [q.id, q.answer])));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = questions.some((q) => (answers[q.id] ?? "") !== q.answer);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const result = await saveAnswers(
        investigationId,
        questions.filter((q) => answers[q.id] !== q.answer).map((q) => ({ id: q.id, answer: answers[q.id] ?? "" })),
      );
      if ("error" in result) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <div className="mt-4 space-y-4">
      {questions.map((q, i) => (
        <div key={q.id}>
          <label htmlFor={`answer-${q.id}`} className="block text-[14px] font-medium">
            {i + 1}. {q.question}
          </label>
          {q.hint && <p className="mt-0.5 text-xs text-ink-subtle">{q.hint}</p>}
          <textarea
            id={`answer-${q.id}`}
            rows={2}
            value={answers[q.id] ?? ""}
            onChange={(e) => {
              setSaved(false);
              setAnswers((a) => ({ ...a, [q.id]: e.target.value }));
            }}
            placeholder="Not answered yet"
            className={`${textareaClass} mt-2`}
          />
        </div>
      ))}
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-3">
        {saved && !changed && (
          <span className="flex items-center gap-1 text-xs text-confirmed-600">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        <Button type="button" size="sm" onClick={save} disabled={!changed || saving}>
          {saving ? <Spinner /> : <Check className="h-3.5 w-3.5" />} Save answers
        </Button>
      </div>
    </div>
  );
}
