"use client";

import { useState } from "react";
import type { ClarifyingQuestion } from "@/lib/types";
import { QuestionCard } from "./QuestionCard";

/** Editable list of an investigation's clarifying questions (edits are local in the preview). */
export function QuestionList({ initial }: { initial: ClarifyingQuestion[] }) {
  const [questions, setQuestions] = useState(initial);
  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          index={i + 1}
          question={q}
          onAnswerChange={(answer) => setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, answer } : x)))}
        />
      ))}
    </div>
  );
}
