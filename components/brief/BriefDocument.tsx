import { OUTCOME_LABEL } from "@/lib/brief/build";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/time";
import type { DecisionBrief, InvestigationDecision } from "@/lib/types";

/**
 * The Decision Brief as a document: twelve sections, read top to bottom.
 * Used in the Report tab, its PDF, and the read-only share page. `decision`
 * is the live decision, which may be newer than the brief.
 */
export function BriefDocument({ brief: b, decision, children }: { brief: DecisionBrief; decision?: Pick<InvestigationDecision, "summary" | "outcome" | "owner" | "createdAt" | "reviewDate" | "successMeasure" | "result" | "warnings">; children?: React.ReactNode }) {
  const status = decision
    ? { decided: true, summary: decision.summary, outcome: decision.outcome, owner: decision.owner, decidedAt: decision.createdAt }
    : b.decisionStatus;
  return (
    <article className="report text-ink">
      <header className="border-b-2 border-ink pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Veyra · Decision Brief</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{b.investigationTitle}</h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          Written {formatDate(b.generatedAt)} · {status.decided ? "Decided" : "Awaiting a decision"} · Confidence {b.confidence.level}
        </p>
      </header>

      <Section n={1} title="Executive summary">
        <p className="text-[14.5px] leading-relaxed">{b.executiveSummary}</p>
      </Section>

      <Section n={2} title="What we found">
        {b.found.length ? (
          <ul className="space-y-1.5">
            {b.found.map((f) => (
              <li key={f.ref} className="flex gap-2">
                <span className="w-7 shrink-0 font-semibold text-ink-subtle">{f.ref}</span>
                <span>
                  {f.title ? <b className="font-semibold">{f.title}. </b> : null}
                  {f.statement}
                  {f.observed && <span className="ml-1 text-ink-muted">[{f.observed}]</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Muted>The data didn&rsquo;t support any findings.</Muted>
        )}
      </Section>

      <Section n={3} title="What we believe">
        <p>{b.believe.summary}</p>
        {b.believe.validated.length > 0 && (
          <List title="Validated" tone="good" items={b.believe.validated.map((v) => `${v.title}${v.reason ? ` — ${v.reason}` : ""}`)} />
        )}
        {b.believe.unvalidated.length > 0 && (
          <List title="Not validated yet (still guesses)" tone="uncertain" items={b.believe.unvalidated.map((h) => `${h.ref}: ${h.title || h.statement} (${h.evidenceStatus})`)} />
        )}
        {b.believe.rejected.length > 0 && <List title="Ruled out" tone="muted" strike items={b.believe.rejected.map((r) => `${r.title}${r.reason ? ` — ${r.reason}` : ""}`)} />}
      </Section>

      <Section n={4} title="Evidence">
        <ul className="space-y-1 text-[13px]">
          {b.evidence.datasets.map((d) => (
            <li key={d.name}>
              <b className="font-medium">{d.name}</b>{" "}
              <span className="text-ink-subtle">
                — {d.source}
                {d.coverage ? `, ${d.coverage}` : ""}
                {d.confidence ? ` · evidence confidence ${d.confidence}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[13px] text-ink-muted">
          {b.evidence.validationEvidence} piece{b.evidence.validationEvidence === 1 ? "" : "s"} of validation evidence · {b.evidence.researchDone.length} research task
          {b.evidence.researchDone.length === 1 ? "" : "s"} finished
        </p>
        {b.evidence.researchDone.length > 0 && <List title="What research found" items={b.evidence.researchDone.map((r) => `${r.title}: ${r.outcome}`)} />}
      </Section>

      <Section n={5} title="Confidence">
        <p>
          <span
            className={cn(
              "mr-2 rounded px-1.5 py-0.5 text-[12px] font-semibold capitalize",
              b.confidence.level === "high" ? "bg-confirmed-50 text-confirmed-600" : b.confidence.level === "medium" ? "bg-brand-50 text-brand-700" : "bg-uncertain-50 text-uncertain-600",
            )}
          >
            {b.confidence.level}
          </span>
          {b.confidence.reason}
        </p>
        {b.confidence.capped && <p className="mt-1 text-[12.5px] text-ink-subtle">Capped: {b.confidence.capped}</p>}
      </Section>

      <Section n={6} title="What we don't know">
        {b.unknowns.openQuestions.length + b.unknowns.untested.length + b.unknowns.assumptions.length === 0 ? (
          <Muted>Nothing important is open.</Muted>
        ) : (
          <>
            {b.unknowns.openQuestions.length > 0 && (
              <List title="Open questions" items={b.unknowns.openQuestions.map((q) => `${q.question}${q.missingEvidence ? ` (missing: ${q.missingEvidence})` : ""}`)} />
            )}
            {b.unknowns.untested.length > 0 && <List title="Hypotheses not yet settled" tone="uncertain" items={b.unknowns.untested} />}
            {b.unknowns.assumptions.length > 0 && <List title="Unresolved assumptions" tone="uncertain" items={b.unknowns.assumptions} />}
          </>
        )}
      </Section>

      <Section n={7} title="Problem to solve">
        {b.problem ? (
          <>
            <p className="font-semibold">&ldquo;{b.problem.statement}&rdquo;</p>
            {b.problem.provisional && <p className="mt-1 text-[12.5px] text-uncertain-600">Provisional: the cause isn&rsquo;t validated yet.</p>}
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <Fact label="Who is affected" value={b.problem.affected} />
              <Fact label="What they're trying to do" value={b.problem.need} />
              <Fact label="What gets in the way" value={b.problem.obstacle} />
              <Fact label="Business impact" value={b.problem.businessImpact} />
            </dl>
          </>
        ) : (
          <Muted>The problem hasn&rsquo;t been defined yet. As asked: &ldquo;{b.problemAsked}&rdquo;</Muted>
        )}
      </Section>

      <Section n={8} title="Opportunity">
        {b.opportunity.pursued.length ? (
          b.opportunity.pursued.map((o) => (
            <div key={o.title} className="mb-2">
              <p>
                <b className="font-semibold">Pursuing: {o.title}.</b> {o.customerProblem}
              </p>
              {o.potentialImpact && <p className="text-[13px] text-ink-muted">{o.potentialImpact}</p>}
            </div>
          ))
        ) : (
          <Muted>No opportunity is being pursued yet.</Muted>
        )}
        {b.opportunity.others.length > 0 && (
          <p className="mt-1 text-[13px] text-ink-muted">
            Also found: {b.opportunity.others.map((o) => `${o.title}${o.status === "parked" ? " (parked)" : ""}`).join("; ")}.
          </p>
        )}
      </Section>

      <Section n={9} title="Possible solution directions">
        {b.solutionDirections.items.length ? (
          <div className="space-y-2">
            {b.solutionDirections.items.map((s) => (
              <div key={s.title} className="rounded-lg border border-line p-3">
                <p className="font-semibold">{s.title}</p>
                <p className="mt-0.5 text-[13px]">{s.description}</p>
                {s.assumptions.length > 0 && <p className="mt-1 text-[12.5px] text-ink-muted">Assumes: {s.assumptions.join("; ")}</p>}
                {s.risks.length > 0 && <p className="text-[12.5px] text-ink-muted">Risks: {s.risks.join("; ")}</p>}
              </div>
            ))}
          </div>
        ) : (
          <Muted>{b.solutionDirections.why}</Muted>
        )}
      </Section>

      <Section n={10} title="Recommended next step">
        <div className="rounded-lg border-2 border-brand-200 bg-brand-50/50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">{OUTCOME_LABEL[b.recommendation.outcome]}</p>
          <p className="mt-0.5 text-[15px] font-semibold">{b.recommendation.title}</p>
          <p className="mt-1">{b.recommendation.reasoning}</p>
          {b.recommendation.escalateTo && b.recommendation.outcome === "escalate" && <p className="mt-1 text-[13px]">Escalate to: {b.recommendation.escalateTo}</p>}
          {b.recommendation.wouldChangeIf.length > 0 && <List title="This would change if" items={b.recommendation.wouldChangeIf} />}
          {b.recommendation.changedWhy && <p className="mt-2 text-[12.5px] text-ink-subtle">Adjusted by Veyra&rsquo;s checks: {b.recommendation.changedWhy}</p>}
          {children}
        </div>
      </Section>

      <Section n={11} title="Validation plan">
        {b.validationPlan.existing.length > 0 && (
          <table className="w-full border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line-strong text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="py-1.5 pr-3 font-semibold">Hypothesis</th>
                <th className="py-1.5 pr-3 font-semibold">Test</th>
                <th className="py-1.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {b.validationPlan.existing.map((v) => (
                <tr key={v.hypothesis} className="border-b border-line align-top">
                  <td className="py-2 pr-3">{v.hypothesis}</td>
                  <td className="py-2 pr-3">{v.method}</td>
                  <td className="py-2 font-medium capitalize">{v.outcome ?? v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {b.validationPlan.proposed.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">Next to validate</p>
            {b.validationPlan.proposed.map((p) => (
              <p key={p.what} className="text-[13px]">
                <b className="font-semibold">{p.what}.</b> {p.how} <span className="text-ink-muted">Success signal: {p.successSignal}</span>
              </p>
            ))}
          </div>
        )}
        {!b.validationPlan.existing.length && !b.validationPlan.proposed.length && <Muted>No validation planned.</Muted>}
      </Section>

      <Section n={12} title="Decision status">
        {status.decided ? (
          <>
            <p>
              <b className="font-semibold">Decided{status.decidedAt ? ` ${formatDate(status.decidedAt)}` : ""}:</b> {status.summary}
            </p>
            <p className="text-[13px] text-ink-muted">
              {status.outcome ? OUTCOME_LABEL[status.outcome] : ""}
              {status.owner ? ` · Owner: ${status.owner}` : ""}
              {decision?.reviewDate ? ` · Review ${formatDate(decision.reviewDate)}` : ""}
            </p>
            {decision?.successMeasure && <p className="mt-1 text-[13px]">Success looks like: {decision.successMeasure}</p>}
            {decision && decision.warnings.length > 0 && <List title="Decided despite" tone="uncertain" items={decision.warnings} />}
            {decision?.result && <p className="mt-2 text-[13px]">What happened: {decision.result}</p>}
          </>
        ) : (
          <Muted>No decision recorded yet. Veyra recommends; the team decides.</Muted>
        )}
      </Section>

      <footer className="mt-8 border-t border-line pt-3 text-[11px] text-ink-faint">
        Prepared with Veyra. Findings come from the team&rsquo;s data; hypotheses are marked until validated; every decision is the team&rsquo;s.
      </footer>
    </article>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid-page text-[13.5px] leading-relaxed">
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-brand-700">
        <span className="mr-1.5 text-ink-faint">{n}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function List({ title, items, tone = "neutral", strike }: { title: string; items: string[]; tone?: "neutral" | "good" | "uncertain" | "muted"; strike?: boolean }) {
  const dot = { neutral: "bg-brand-500", good: "bg-confirmed-600", uncertain: "bg-uncertain-600", muted: "bg-slate-400" }[tone];
  return (
    <div className="mt-2">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">{title}</p>
      <ul className="mt-1 space-y-1">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-[13px]">
            <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
            <span className={cn(strike && "text-ink-subtle line-through")}>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-ink-muted">{children}</p>;
}
