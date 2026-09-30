"use client";

import { ArrowLeft, ArrowRight, CircleSlash, Compass, Database } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { createInvestigation, planInvestigation } from "@/lib/data/investigations";
import { routes } from "@/lib/routes";
import { appActions, useAppState, useHydrated } from "@/lib/store/app-store";
import type { InvestigationDraft } from "@/lib/types";
import { NewInvestigationSteps } from "./NewInvestigationSteps";

export function InvestigationPlanView() {
  const hydrated = useHydrated();
  const { draft } = useAppState();
  const [creating, setCreating] = useState(false);

  if (!hydrated) return <div className="min-h-[60vh]" />;
  if (creating) return <CreatingState />;
  if (!draft) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4 text-center">
        <div>
          <p className="font-medium">Start by describing the problem.</p>
          <ButtonLink href={routes.newInvestigation} className="mt-4">
            New Investigation <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    );
  }
  return <PlanBody draft={draft} onCreating={() => setCreating(true)} />;
}

/** Veyra's proposed investigation: methods chosen for this problem, and those deliberately left out. */
function PlanBody({ draft, onCreating }: { draft: InvestigationDraft; onCreating: () => void }) {
  const router = useRouter();
  const plan = draft.plan;

  useEffect(() => {
    if (plan) return;
    let cancelled = false;
    planInvestigation(draft).then((p) => {
      if (!cancelled) appActions.saveDraft({ ...draft, plan: p });
    });
    return () => {
      cancelled = true;
    };
  }, [draft, plan]);

  async function start() {
    onCreating();
    const { id } = await createInvestigation(draft);
    router.push(routes.investigation(id));
    appActions.clearDraft();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <Link href={routes.clarifyingQuestions} className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <NewInvestigationSteps current={4} />
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-600">Investigation plan</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">How Veyra will investigate this</h1>
      <p className="mt-1 text-ink-muted">&ldquo;{draft.problem}&rdquo;</p>

      {!plan ? (
        <p className="mt-10 flex items-center gap-2 text-sm text-ink-subtle">
          <Spinner className="text-brand-600" /> Choosing the right methods for this problem…
        </p>
      ) : (
        <>
          <section className="mt-6 flex gap-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <Compass className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-sm leading-relaxed text-ink">{plan.summary}</p>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section>
              <h2 className="text-[15px] font-semibold">Methods Veyra will use</h2>
              <ol className="mt-3 space-y-2">
                {plan.methods.map((m, i) => (
                  <li key={m.id} className="flex gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-card">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium">{m.name}</p>
                      <p className="text-[13px] text-ink-muted">{m.why}</p>
                      {m.uses && (
                        <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-ink-subtle">
                          <Database className="h-3 w-3" /> {m.uses.join(" · ")}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            {plan.notUsed.length > 0 && (
              <section>
                <h2 className="text-[15px] font-semibold">Not using — and why</h2>
                <p className="mt-0.5 text-xs text-ink-subtle">Frameworks are tools, not steps. Veyra only uses what fits.</p>
                <ul className="mt-3 space-y-2">
                  {plan.notUsed.map((n) => (
                    <li key={n.name} className="flex gap-2.5 rounded-xl border border-dashed border-line-strong bg-canvas/50 p-3.5">
                      <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                      <div>
                        <p className="text-[13.5px] font-medium text-ink-muted">{n.name}</p>
                        <p className="text-[13px] text-ink-subtle">{n.why}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-ink-subtle">The plan adapts as evidence comes in. You stay in charge of the decisions.</p>
            <Button size="lg" onClick={start}>
              Start investigation <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function CreatingState() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="text-center">
        <Spinner className="mx-auto h-6 w-6 text-brand-600" />
        <p className="mt-4 font-medium">Starting the investigation…</p>
        <p className="mt-1 text-sm text-ink-subtle">Reading connected data and gathering evidence.</p>
      </div>
    </div>
  );
}
