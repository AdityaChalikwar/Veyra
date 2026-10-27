"use client";

import { ArrowRight, CheckCircle2, Compass, FileText, Gavel, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reopenInvestigation } from "@/app/(app)/investigations/decision-actions";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { nextAction, type NextAction } from "@/lib/investigation/guide";
import { routes } from "@/lib/routes";
import { useWorkspace } from "./workspace-context";

/**
 * One line under the progress stages saying what moves the investigation
 * forward right now, with a link to where that happens.
 */
export function NextActionBar() {
  const { workspace, progress, choice } = useWorkspace();
  const id = workspace.investigation.id;
  const lead = workspace.validations.find((v) => v.status !== "completed");
  const leadLabel = workspace.hypotheses.find((h) => h.id === lead?.hypothesisId)?.label ?? "the leading hypothesis";

  const live = workspace.live;
  if (live) return <LiveNext action={nextAction({ ...workspace, live })} id={id} />;

  let text: string;
  let cta: string;
  let tab: string;
  if (progress.complete) {
    const o = workspace.opportunities.find((x) => x.id === choice?.opportunityId);
    text = `Investigation complete. The team chose to pursue “${o?.title}”.`;
    cta = "View report";
    tab = "report";
  } else if (progress.current === "s-opportunity") {
    text = "Problem validated. Choose the opportunity worth pursuing.";
    cta = "Choose an opportunity";
    tab = "opportunities";
  } else if (progress.current === "s-market") {
    text = "Finish the market context: run the competitor research.";
    cta = "Go to Customers & Market";
    tab = "customers";
  } else if (progress.allRejected) {
    text = "Every hypothesis was rejected. Go back to research to find a new explanation.";
    cta = "Go to Research";
    tab = "research";
  } else if (lead?.status === "not-started") {
    text = `Validate the problem: start the ${leadLabel} validation.`;
    cta = "Go to Validation";
    tab = "validation";
  } else if (lead?.status === "running" && !lead.result) {
    text = `${leadLabel} validation is running. Collect the results when they're ready.`;
    cta = "Go to Validation";
    tab = "validation";
  } else {
    text = `Results are in for ${leadLabel}. Record whether they confirm or reject it.`;
    cta = "Review results";
    tab = "validation";
  }

  return (
    <div
      className={cn(
        "mt-2 flex flex-col gap-2 rounded-lg border px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between",
        progress.complete ? "border-confirmed-200 bg-confirmed-50" : "border-brand-200 bg-brand-50/60",
      )}
    >
      <p className={cn("flex items-start gap-2 text-[13px]", progress.complete ? "text-confirmed-600" : "text-brand-700")}>
        {progress.complete ? <FileText className="mt-0.5 h-4 w-4 shrink-0" /> : <Compass className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>
          <b className="font-semibold">{progress.complete ? "Done." : "Next:"}</b> {text}
        </span>
      </p>
      <Link href={routes.investigation(id, tab)} className={buttonClass({ size: "sm", variant: progress.complete ? "primary" : "secondary", className: "shrink-0" })}>
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

const TONE = {
  next: { box: "border-brand-200 bg-brand-50/60", text: "text-brand-700", Icon: Compass },
  working: { box: "border-brand-200 bg-brand-50/60", text: "text-brand-700", Icon: Loader2 },
  ready: { box: "border-confirmed-200 bg-confirmed-50", text: "text-confirmed-600", Icon: Gavel },
  done: { box: "border-confirmed-200 bg-confirmed-50", text: "text-confirmed-600", Icon: CheckCircle2 },
} as const;

/** The team's own investigation: what moves it forward now, and when it is ready to decide. */
function LiveNext({ action: a, id }: { action: NextAction; id: string }) {
  const t = TONE[a.tone];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function reopen() {
    setBusy(true);
    setError(null);
    const r = await reopenInvestigation(id).catch(() => ({ error: "Couldn't reach Veyra. Check your connection and try again." }));
    if ("error" in r) setError(r.error);
    else router.refresh();
    setBusy(false);
  }
  return (
    <div className={cn("mt-2 flex flex-col gap-2 rounded-lg border px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between", t.box)}>
      <p className={cn("flex items-start gap-2 text-[13px]", t.text)}>
        <t.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", a.tone === "working" && "animate-spin")} />
        <span>
          <b className="font-semibold">{a.label}</b> {a.text}
          {error && <span className="mt-0.5 block text-danger-600">{error}</span>}
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {a.tone === "done" && (
          <button type="button" disabled={busy} onClick={reopen} className="text-[13px] font-medium text-ink-subtle hover:text-ink disabled:opacity-50">
            {busy ? "Reopening…" : "Reopen"}
          </button>
        )}
        {a.alt && (
          <Link href={routes.investigation(id, a.alt.tab)} className="text-[13px] font-medium text-ink-subtle hover:text-ink">
            {a.alt.cta}
          </Link>
        )}
        <Link href={routes.investigation(id, a.tab)} className={buttonClass({ size: "sm", variant: a.tone === "ready" ? "primary" : "secondary", className: "shrink-0" })}>
          {a.cta} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
