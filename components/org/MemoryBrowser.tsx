"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { formatDate } from "@/lib/time";
import type { BusinessMemory, MemoryCategory, MemoryStory } from "@/lib/types";

type Filter = "all" | MemoryCategory;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "company", label: "Business Context" },
  { id: "segments", label: "Customer Segments" },
  { id: "validated-problems", label: "Validated Problems" },
  { id: "rejected-hypotheses", label: "Rejected Hypotheses" },
  { id: "investigations", label: "Past Investigations" },
  { id: "research", label: "Research" },
  { id: "decisions", label: "Decisions" },
  { id: "experiments", label: "Experiments" },
  { id: "learnings", label: "Learnings" },
];

const categoryLabel: Record<MemoryCategory, string> = {
  company: "Business context",
  segments: "Segment",
  "validated-problems": "Validated problem",
  "rejected-hypotheses": "Rejected hypothesis",
  investigations: "Investigation",
  research: "Research",
  decisions: "Decision",
  experiments: "Experiment",
  learnings: "Learning",
};

export function MemoryBrowser({ memory }: { memory: BusinessMemory }) {
  const [filter, setFilter] = useState<Filter>("all");
  const showStories = filter === "all" || filter === "investigations";
  const entries = memory.entries.filter((e) => filter === "all" || e.category === filter);

  return (
    <div className="mt-6">
      <div role="tablist" aria-label="Memory type" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((f) => (
          <button
            key={f.id}
            role="tab"
            type="button"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1 text-[13px] transition-colors",
              filter === f.id ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showStories && (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold">From problem to learning</h2>
          <p className="mt-1 text-[13px] text-ink-subtle">Past investigations, from problem to what was learned. New investigations start from here, not from zero.</p>
          <div className="mt-4 space-y-4">
            {memory.stories.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        </section>
      )}

      {entries.length > 0 && (
        <section className="mt-8">
          {filter === "all" && <h2 className="mb-4 text-[15px] font-semibold">Everything Veyra knows</h2>}
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card">
                <span className="w-fit rounded bg-canvas px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-subtle">
                  {categoryLabel[e.category]}
                </span>
                <h3 className="mt-2 text-[14.5px] font-semibold leading-snug">{e.title}</h3>
                <p className="mt-1 flex-1 text-[13px] leading-relaxed text-ink-muted">{e.body}</p>
                {(e.sourceInvestigationId || e.date) && (
                  <p className="mt-3 border-t border-line pt-2.5 text-xs text-ink-subtle">
                    {e.sourceInvestigationId && (
                      <Link href={routes.investigation(e.sourceInvestigationId)} className="hover:text-brand-600">
                        From {e.sourceInvestigationTitle}
                      </Link>
                    )}
                    {e.sourceInvestigationId && e.date && " · "}
                    {e.date && formatDate(e.date)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!showStories && entries.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-subtle">Nothing here yet. Veyra adds to memory as investigations finish.</p>
      )}
    </div>
  );
}

function StoryCard({ story: s }: { story: MemoryStory }) {
  const steps = [
    { label: "Decision", text: s.decision },
    { label: "Experiment", text: s.experiment },
    { label: "Result", text: s.result, emphasis: true },
    { label: "Learning", text: s.learning },
  ];
  return (
    <article className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold">
          <Link href={routes.investigation(s.investigationId)} className="hover:text-brand-700">
            {s.investigationTitle}
          </Link>{" "}
          <span className="font-normal text-ink-subtle">— {new Date(s.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
        </h3>
        <span className="text-xs text-ink-subtle">Past investigation</span>
      </div>
      <p className="mt-1 text-[13px] text-ink-muted">{s.problem}</p>
      <ol className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-[repeat(4,minmax(0,1fr))] lg:gap-6">
        {steps.map((step, i) => (
          <li key={step.label} className="relative">
            <div className={cn("h-full rounded-lg border px-3 py-2.5", step.emphasis ? "border-confirmed-200 bg-confirmed-50/60" : "border-line bg-canvas/60")}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{step.label}</p>
              <p className={cn("mt-0.5 text-[13px] leading-snug", step.emphasis ? "font-semibold text-confirmed-600" : "text-ink")}>{step.text}</p>
            </div>
            {i < steps.length - 1 && (
              <>
                <ArrowRight className="absolute -right-[19px] top-1/2 z-10 hidden h-3.5 w-3.5 -translate-y-1/2 text-ink-faint lg:block" aria-hidden="true" />
                <ArrowDown className="mx-auto my-0.5 h-3.5 w-3.5 text-ink-faint lg:hidden" aria-hidden="true" />
              </>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}
