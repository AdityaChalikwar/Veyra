"use client";

import { ArrowRight, Compass, FileText } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
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

  let text: string;
  let cta: string;
  let tab: string;
  const live = workspace.live;
  if (live) {
    if (!workspace.evidence.length) {
      text = "Add data: upload a CSV export, such as events, sign-ups, orders or support tickets.";
      cta = "Upload data";
      tab = "evidence";
    } else if (!live.run) {
      text = "Analyse your data to turn it into findings, hypotheses and a recommended next step.";
      cta = "Go to Evidence";
      tab = "evidence";
    } else {
      text = "Review what the data shows and the hypotheses that might explain it. Validating them comes next.";
      cta = "Review findings";
      tab = "findings";
    }
  } else if (progress.complete) {
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
