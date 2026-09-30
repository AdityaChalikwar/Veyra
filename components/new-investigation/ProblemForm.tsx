"use client";

import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { getDemoDraft, suggestContext } from "@/lib/data/investigations";
import { routes } from "@/lib/routes";
import { appActions, useAppState, useHydrated } from "@/lib/store/app-store";
import type { BusinessContext, InvestigationDraft } from "@/lib/types";
import { NewInvestigationSteps } from "./NewInvestigationSteps";
import { ProblemChecklist } from "./ProblemChecklist";

export function ProblemForm() {
  // The form is seeded from saved state, so wait until it's readable.
  const hydrated = useHydrated();
  return hydrated ? <ProblemFormInner /> : <div className="min-h-[60vh]" />;
}

/**
 * Pick what the form starts with: a problem typed on the dashboard wins,
 * then a draft the user is returning to, then the demo investigation.
 */
function useInitialDraft(): InvestigationDraft {
  const searchParams = useSearchParams();
  const { draft, company } = useAppState();
  const fromDashboard = searchParams.get("problem")?.trim();

  if (fromDashboard && fromDashboard !== draft?.problem) {
    return { problem: fromDashboard, goal: "", context: suggestContext(company?.description) };
  }
  return draft ?? getDemoDraft();
}

function ProblemFormInner() {
  const router = useRouter();
  const { draft: savedDraft } = useAppState();
  const initial = useInitialDraft(); // only the first render's value is used below
  const [problem, setProblem] = useState(initial.problem);
  const [goal, setGoal] = useState(initial.goal);
  const [context, setContext] = useState<BusinessContext>(initial.context);

  const setContextField = (key: keyof BusinessContext) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setContext((c) => ({ ...c, [key]: e.target.value }));

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!problem.trim()) return;
    const next: InvestigationDraft = { problem: problem.trim(), goal: goal.trim(), context };
    // Keep generated questions (and edited answers) unless the problem itself changed.
    const unchanged = savedDraft && savedDraft.problem === next.problem && savedDraft.goal === next.goal;
    appActions.saveDraft(unchanged ? { ...next, questions: savedDraft.questions } : next);
    router.push(routes.clarifyingQuestions);
  }

  return (
    <form onSubmit={handleContinue} className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href={routes.dashboard} className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <NewInvestigationSteps current={0} />
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-[28px]">What are you trying to solve?</h1>
      <p className="mt-1 text-ink-muted">Describe the problem in your own words. Veyra will ask about anything unclear.</p>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <label htmlFor="problem" className="text-[15px] font-semibold">
              The problem
            </label>
            <textarea
              id="problem"
              rows={3}
              autoFocus
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Our monthly sales have fallen 25% over the last six months."
              className={`${textareaClass} mt-3 text-[15px]`}
            />
          </section>

          <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <label htmlFor="goal" className="text-[15px] font-semibold">
              Business goal
            </label>
            <p className="mt-0.5 text-[13px] text-ink-subtle">What outcome are you trying to achieve?</p>
            <textarea
              id="goal"
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Identify the main causes and decide what actions could reverse the decline."
              className={`${textareaClass} mt-3`}
            />
          </section>

          <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[15px] font-semibold">Business context</h2>
            <p className="mt-0.5 text-[13px] text-ink-subtle">Helps Veyra pick the right data, benchmarks and frameworks.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Product" htmlFor="ctx-product" className="sm:col-span-2">
                <input id="ctx-product" value={context.product} onChange={setContextField("product")} placeholder="Mobile consumer application" className={inputClass} />
              </Field>
              <Field label="Business model" htmlFor="ctx-model">
                <input id="ctx-model" value={context.businessModel} onChange={setContextField("businessModel")} placeholder="Freemium subscription" className={inputClass} />
              </Field>
              <Field label="Time period" htmlFor="ctx-period">
                <input id="ctx-period" value={context.timePeriod} onChange={setContextField("timePeriod")} placeholder="April – August 2026" className={inputClass} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <ProblemChecklist problem={problem} />
          <div className="flex gap-2.5 rounded-xl bg-brand-50/60 p-4 text-[13px] leading-relaxed text-ink-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p>
              Next, Veyra asks a few clarifying questions. You don&rsquo;t need every answer — anything you don&rsquo;t
              know becomes an open question in the investigation.
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-line pt-6">
        <Button type="submit" size="lg" disabled={!problem.trim()}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
