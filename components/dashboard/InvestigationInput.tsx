"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

const examples = [
  "Customer churn increased this quarter",
  "Our conversion rate dropped after a redesign",
  "Should we expand into a new market?",
];

export function InvestigationInput() {
  const router = useRouter();
  const [problem, setProblem] = useState("");

  function start(e: React.FormEvent) {
    e.preventDefault();
    const text = problem.trim();
    router.push(text ? `${routes.newInvestigation}?problem=${encodeURIComponent(text)}` : routes.newInvestigation);
  }

  return (
    <form onSubmit={start} className="rounded-2xl border border-line bg-surface p-2 shadow-card focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50">
      <label htmlFor="problem" className="sr-only">
        Describe the business problem
      </label>
      <textarea
        id="problem"
        rows={3}
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start(e);
        }}
        placeholder="Our monthly sales have fallen 25% over the last six months."
        className="block w-full resize-none rounded-xl bg-transparent px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint outline-none"
      />
      <div className="flex flex-col gap-3 border-t border-line px-2 pb-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setProblem(ex)}
              className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              {ex}
            </button>
          ))}
        </div>
        <Button type="submit" className="shrink-0">
          Start Investigation <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
