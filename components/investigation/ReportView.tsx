"use client";

import { Download, FileText, Info } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/store/app-store";
import { formatDate } from "@/lib/time";
import type { Hypothesis, ValidationPlan } from "@/lib/types";
import { ComingNext } from "./ComingNext";
import { useWorkspace } from "./workspace-context";

/**
 * The investigation summarised as a report. "Download PDF" prints only the
 * report (see `.printing-report` in globals.css); the browser saves it as a PDF.
 */
export function ReportView() {
  const { workspace, progress } = useWorkspace();
  const mounted = useHydrated();
  const live = !!workspace.live;

  useEffect(() => {
    document.documentElement.classList.add("printing-report");
    return () => document.documentElement.classList.remove("printing-report");
  }, []);

  if (live) {
    return (
      <ComingNext title="The report comes with the Decision Brief">
        <p>
          A downloadable report of this investigation — problem, evidence, findings, hypotheses, decision — arrives once decisions can be
          recorded. Everything it will draw on is already in the other tabs.
        </p>
      </ComingNext>
    );
  }

  function download() {
    const previous = document.title;
    // The browser uses the page title as the PDF's file name.
    document.title = `${workspace.investigation.title} — Veyra report`;
    window.addEventListener("afterprint", () => (document.title = previous), { once: true });
    window.print();
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-brand-600" /> Investigation report
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-subtle">
            {progress.complete
              ? "Final. Everything the team learned and decided, in one place."
              : "Draft. It fills in as the investigation progresses and is final once an opportunity is chosen."}
          </p>
        </div>
        <Button type="button" onClick={download} className="shrink-0">
          <Download className="h-4 w-4" /> Download PDF
        </Button>
      </div>
      <p className="mb-4 flex items-start gap-2 text-xs text-ink-faint">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> In the print window, choose &ldquo;Save as PDF&rdquo; as the destination.
      </p>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-card sm:p-10">
        <InvestigationReport />
      </div>

      {mounted &&
        createPortal(
          <div id="report-print">
            <InvestigationReport />
          </div>,
          document.body,
        )}
    </div>
  );
}

const outcomeText = { confirmed: "Confirmed", rejected: "Rejected" } as const;

function InvestigationReport() {
  const { workspace: w, progress, choice, nextStepAcceptedAt } = useWorkspace();
  const inv = w.investigation;
  const observations = w.findings.filter((f) => f.kind === "observation");
  const insights = w.findings.filter((f) => f.kind === "insight");
  const confirmed = w.hypotheses.find((h) => h.status === "confirmed");
  const confirmedValidation = w.validations.find((v) => v.hypothesisId === confirmed?.id);
  const chosen = w.opportunities.find((o) => o.id === choice?.opportunityId);
  const idea = chosen?.ideas.find((i) => i.id === choice?.ideaId);
  const others = w.opportunities.filter((o) => o.id !== chosen?.id);
  const stillOpen = w.openQuestions.filter((q) => !q.answeredByFindingId);
  const currentStage = w.stages.find((s) => s.id === progress.current)?.label;

  const decisions: { at: string; text: string }[] = [
    ...(nextStepAcceptedAt ? [{ at: nextStepAcceptedAt, text: `Accepted the next step: ${w.nextStep.title}` }] : []),
    ...w.validations
      .filter((v) => v.outcome && v.completedAt)
      .map((v) => ({ at: v.completedAt!, text: `${outcomeText[v.outcome!]} ${label(w.hypotheses, v)} after: ${v.test}` })),
    ...(chosen && choice ? [{ at: choice.decidedAt, text: `Chose to pursue “${chosen.title}”${idea ? `, testing “${idea.title}” first` : ""}` }] : []),
  ];

  return (
    <article className="report text-ink">
      <header className="border-b-2 border-ink pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Veyra · Investigation report</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{inv.title}</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          {progress.complete ? "Completed" : `Draft — in progress (${currentStage ?? "investigating"})`} · Started {formatDate(inv.createdAt)} ·
          Report generated {formatDate(new Date().toISOString())} · {inv.evidenceCount} evidence sources · Confidence {inv.confidence}
        </p>
      </header>

      <Section title="Summary">
        <p>
          The team set out to understand why <b>&ldquo;{inv.problem}&rdquo;</b>
          {confirmed ? (
            <>
              {" "}
              Testing confirmed the cause: <b>{w.problem.refined}</b> {confirmedValidation?.result?.summary}
            </>
          ) : (
            <> The leading explanation is {w.hypotheses[0]?.label}: {w.hypotheses[0]?.statement} It hasn&rsquo;t been validated yet.</>
          )}
        </p>
        {chosen ? (
          <p className="mt-2">
            The team chose to pursue <b>{chosen.title}</b>
            {idea ? (
              <>
                , testing <b>{idea.title}</b> first
              </>
            ) : null}
            . Success will show in {confirmedValidation?.metric.toLowerCase() ?? "the activation rate"}.
          </p>
        ) : (
          <p className="mt-2 text-ink-muted">No opportunity has been chosen yet.</p>
        )}
      </Section>

      <Section title="The problem">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <Fact label="Original problem" value={w.problem.original} />
          <Fact label={confirmed ? "Validated problem" : "Refined problem (not yet validated)"} value={w.problem.refined} />
          <Fact label="Who is affected" value={w.problem.whoIsAffected} />
          <Fact label="What's getting in the way" value={w.problem.inTheWay} />
          <Fact label="Business consequence" value={w.problem.consequence} />
          <Fact label="Confidence" value={capitalise(w.problem.confidence)} />
        </dl>
      </Section>

      <Section title="What the evidence showed">
        <ul className="list-disc space-y-1 pl-5">
          {observations.map((f) => (
            <li key={f.id}>{f.statement}</li>
          ))}
        </ul>
        {insights.length > 0 && (
          <>
            <p className="mt-3 font-semibold">Insights</p>
            <ul className="list-disc space-y-1 pl-5">
              {insights.map((f) => (
                <li key={f.id}>{f.statement}</li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="Hypotheses and validation">
        <table className="w-full border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line-strong text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="py-1.5 pr-3 font-semibold">Hypothesis</th>
              <th className="py-1.5 pr-3 font-semibold">How it was tested</th>
              <th className="py-1.5 pr-3 font-semibold">Result</th>
              <th className="py-1.5 font-semibold">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {w.hypotheses.map((h) => {
              const v = w.validations.find((x) => x.hypothesisId === h.id);
              return (
                <tr key={h.id} className="border-b border-line align-top">
                  <td className="py-2 pr-3">
                    <b>{h.label}</b> {h.statement}
                  </td>
                  <td className="py-2 pr-3">{v?.test ?? "—"}</td>
                  <td className="py-2 pr-3">{v?.result?.summary ?? (v?.status === "running" ? "Running" : "Not tested")}</td>
                  <td
                    className={cn(
                      "py-2 font-semibold",
                      h.status === "confirmed" ? "text-confirmed-600" : h.status === "rejected" ? "text-ink-subtle" : "text-uncertain-600",
                    )}
                  >
                    {h.status && h.status !== "open" ? outcomeText[h.status] : "Open"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <Section title="Opportunity">
        {chosen ? (
          <>
            <p>
              <b>Chosen: {chosen.title}.</b> {chosen.description}
            </p>
            <p className="mt-1 text-ink-muted">
              {chosen.impact && `Potential impact ${chosen.impact} · `}Evidence {chosen.evidenceStrength} · Confidence {chosen.confidence}
            </p>
            {idea && (
              <div className="mt-3 rounded-lg border border-line p-3">
                <p className="font-semibold">First direction to test: {idea.title}</p>
                <p className="mt-1">
                  <span className="text-ink-subtle">Assumptions:</span> {idea.assumptions.join(" ")}
                </p>
                <p className="mt-0.5">
                  <span className="text-ink-subtle">Risks:</span> {idea.risks.join(" ")}
                </p>
              </div>
            )}
            {others.length > 0 && (
              <p className="mt-3">
                <span className="text-ink-subtle">Also considered:</span> {others.map((o) => o.title).join("; ")}.
              </p>
            )}
          </>
        ) : (
          <p className="text-ink-muted">Not chosen yet. Opportunities open once the problem is validated.</p>
        )}
      </Section>

      <Section title="Decisions">
        {decisions.length ? (
          <ul className="space-y-1">
            {decisions.map((d) => (
              <li key={d.text} className="flex gap-3">
                <span className="w-24 shrink-0 text-ink-subtle">{formatDate(d.at)}</span>
                <span>{d.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted">No decisions recorded yet.</p>
        )}
      </Section>

      {stillOpen.length > 0 && (
        <Section title="Still open">
          <ul className="list-disc space-y-1 pl-5">
            {stillOpen.map((q) => (
              <li key={q.id}>{q.question}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Evidence sources">
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-2">
          {w.evidence.map((e) => (
            <li key={e.id}>
              <b className="font-medium">{e.name}</b> <span className="text-ink-subtle">— {e.source}{e.coverage ? `, ${e.coverage}` : ""}</span>
            </li>
          ))}
        </ul>
      </Section>

      <footer className="mt-8 border-t border-line pt-3 text-[11px] text-ink-faint">
        Prepared with Veyra. Veyra investigates and recommends; every decision above was made by the team.
      </footer>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid-page text-[13.5px] leading-relaxed">
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-brand-700">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function label(hypotheses: Hypothesis[], v: ValidationPlan) {
  return hypotheses.find((h) => h.id === v.hypothesisId)?.label ?? "hypothesis";
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
