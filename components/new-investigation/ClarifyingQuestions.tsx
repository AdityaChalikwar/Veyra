"use client";

import { ArrowLeft, ArrowRight, ChevronDown, Pencil, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { QuestionCard } from "@/components/investigation/QuestionCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { suggestQuestions } from "@/app/(app)/investigations/actions";
import { outcomesLabel, triggersLabel } from "@/lib/options";
import { routes } from "@/lib/routes";
import { appActions, useAppState, useHydrated } from "@/lib/store/app-store";
import { cn } from "@/lib/cn";
import type { InvestigationDraft, NeededInfo } from "@/lib/types";
import { NewInvestigationSteps } from "./NewInvestigationSteps";

export function ClarifyingQuestions({ sourceNames }: { sourceNames: Record<string, string> }) {
  const hydrated = useHydrated();
  const { draft } = useAppState();

  if (!hydrated) return <div className="min-h-[60vh]" />;
  if (!draft) return <NoDraft />;
  return <QuestionsView draft={draft} sourceNames={sourceNames} />;
}

function QuestionsView({ draft, sourceNames }: { draft: InvestigationDraft; sourceNames: Record<string, string> }) {
  const router = useRouter();
  const questions = draft.questions;
  const [notice, setNotice] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Veyra works out what it needs to know for this problem, then asks about the gaps.
  useEffect(() => {
    if (questions) return;
    let cancelled = false;
    suggestQuestions(draft)
      .then((r) => {
        if (cancelled) return;
        if (r.error) setNotice(`${r.error} These are standard questions instead.`);
        appActions.saveDraft({ ...draft, questions: r.questions, needed: r.needed });
      })
      .catch(() => {
        if (!cancelled) setNotice("Couldn't reach Veyra. Check your connection and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [draft, questions, attempt]);

  function regenerate() {
    setNotice(null);
    appActions.saveDraft({ ...draft, questions: undefined, needed: undefined });
    setAttempt((a) => a + 1);
  }

  function updateAnswer(id: string, answer: string) {
    if (!questions) return;
    appActions.saveDraft({ ...draft, questions: questions.map((q) => (q.id === id ? { ...q, answer } : q)) });
  }

  function toPlan() {
    if (!questions) return;
    router.push(routes.investigationPlan);
  }

  const answered = questions?.filter((q) => q.answer.trim()).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href={routes.newInvestigation} className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <NewInvestigationSteps current={3} />
      </div>

      <div className="mt-6 flex items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface shadow-card">
          <LogoMark className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium text-brand-600">Contextual questions</p>
          <h1 className="mt-0.5 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            Before investigating, Veyra needs to understand a few things.
          </h1>
        </div>
      </div>

      <ProblemSummary draft={draft} sourceNames={sourceNames} />

      {questions && draft.needed && draft.needed.length > 0 && <NeededList needed={draft.needed} />}

      {notice && (
        <p role="status" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-uncertain-200 bg-uncertain-50 px-3.5 py-2.5 text-[13px] text-uncertain-600 sm:ml-[54px]">
          <span>{notice}</span>
          {questions && (
            <button type="button" onClick={regenerate} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          )}
        </p>
      )}

      <div className="mt-6 space-y-3" aria-busy={!questions}>
        {questions
          ? questions.map((q, i) => (
              <QuestionCard key={q.id} index={i + 1} question={q} onAnswerChange={(a) => updateAnswer(q.id, a)} />
            ))
          : <QuestionsLoading />}
      </div>

      {questions && !notice && (
        <button type="button" onClick={regenerate} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ink-subtle hover:text-ink">
          <RefreshCw className="h-3.5 w-3.5" /> Ask different questions
        </button>
      )}

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-line bg-canvas/95 px-4 py-4 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-subtle">
            {questions ? (
              <>
                <span className="font-medium text-ink">
                  {answered} of {questions.length} answered.
                </span>{" "}
                {answered < questions.length && "Unanswered questions become open unknowns."}
              </>
            ) : (
              "Preparing questions…"
            )}
          </p>
          <Button size="lg" onClick={toPlan} disabled={!questions}>
            Continue to plan <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProblemSummary({ draft, sourceNames }: { draft: InvestigationDraft; sourceNames: Record<string, string> }) {
  const chips = [
    draft.triggers.length > 0 && `Trigger: ${triggersLabel(draft.triggers)}`,
    draft.outcomes.length > 0 && `Outcome: ${outcomesLabel(draft.outcomes)}`,
  ].filter(Boolean) as string[];
  const sources = draft.dataSourceIds.map((id) => sourceNames[id]).filter(Boolean);
  return (
    <section className="mt-6 rounded-xl border border-line bg-surface p-4 shadow-card sm:ml-[54px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Problem</p>
            <p className="text-sm text-ink">{draft.problem}</p>
          </div>
          {draft.knownContext && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">What you already know</p>
              <p className="text-sm text-ink-muted">{draft.knownContext}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {chips.map((c) => (
              <span key={c} className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-subtle">
                {c}
              </span>
            ))}
            {sources.length > 0 && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">Data: {sources.join(", ")}</span>
            )}
          </div>
        </div>
        <Link
          href={routes.newInvestigation}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-subtle hover:bg-canvas hover:text-ink"
        >
          <Pencil className="h-3 w-3" /> Edit
        </Link>
      </div>
    </section>
  );
}

function QuestionsLoading() {
  return (
    <>
      <p className="flex items-center gap-2 text-sm text-ink-subtle">
        <Spinner className="text-brand-600" /> Veyra is working out what it needs to know to solve this… this can take up to a minute.
      </p>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-line bg-surface p-5">
          <div className="flex gap-3.5">
            <div className="h-7 w-7 rounded-full bg-line" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-2/3 rounded bg-line" />
              <div className="h-3 w-1/2 rounded bg-line/70" />
              <div className="h-10 rounded-lg bg-canvas" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function NoDraft() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="max-w-sm text-center">
        <p className="font-medium">Start by describing the problem.</p>
        <p className="mt-1 text-sm text-ink-subtle">Veyra asks clarifying questions once it knows what you&rsquo;re investigating.</p>
        <ButtonLink href={routes.newInvestigation} className="mt-5">
          New Investigation <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>
    </div>
  );
}


const statusStyle: Record<NeededInfo["status"], { label: string; className: string }> = {
  known: { label: "Known", className: "bg-confirmed-50 text-confirmed-600" },
  "partly-known": { label: "Partly known", className: "bg-uncertain-50 text-uncertain-600" },
  unknown: { label: "Unknown", className: "bg-slate-100 text-slate-600" },
};

/** What Veyra worked out it needs to know; the questions below ask about the gaps. */
function NeededList({ needed }: { needed: NeededInfo[] }) {
  const [open, setOpen] = useState(false);
  const gaps = needed.filter((n) => n.status !== "known").length;
  return (
    <section className="mt-4 rounded-xl border border-line bg-surface shadow-card sm:ml-[54px]">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="text-[13px]">
          <span className="font-medium text-ink">What Veyra needs to know</span>{" "}
          <span className="text-ink-subtle">
            · {needed.length} things, {gaps} not yet known
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="space-y-2 border-t border-line px-4 py-3">
          {needed.map((n) => (
            <li key={n.item} className="flex items-start justify-between gap-3 text-[13px]">
              <span className="min-w-0">
                <span className="font-medium text-ink">{n.item}.</span> <span className="text-ink-muted">{n.why}</span>
              </span>
              <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium", statusStyle[n.status].className)}>
                {statusStyle[n.status].label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
