import { CircleHelp, Database, FlaskConical, Lightbulb, Route, ShieldAlert, Target } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EvidenceStrengthBadge } from "@/components/ui/EvidenceStrengthBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { cn } from "@/lib/cn";
import type { AnalysisRunRecord } from "@/lib/types";

type Run = AnalysisRunRecord & { result: NonNullable<AnalysisRunRecord["result"]> };

const NEXT_STEP_LABELS = {
  research: "Research",
  analysis: "More analysis",
  validation: "Validate",
  "solution-exploration": "Explore solutions",
  hold: "Hold",
} as const;

/**
 * What an analysis found, laid out so every claim shows where it came from:
 * findings name their datasets, and hypotheses, the problem and opportunities
 * name the findings behind them. Read-only: nothing here changes the
 * investigation.
 */
export function AnalysisView({ run }: { run: Run }) {
  const { result: r, datasets } = run;
  const dataset = (ref: string) => datasets.find((d) => d.ref === ref);

  return (
    <div className="space-y-6">
      <p className="text-[14px] leading-relaxed text-ink">{r.summary}</p>

      <Block icon={<Target className="h-4 w-4 text-brand-600" />} title="Refined problem">
        <div className="rounded-xl border border-line bg-canvas p-4">
          <p className="text-[15px] font-medium">&ldquo;{r.refinedProblem.statement}&rdquo;</p>
          <dl className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
            <Fact label="What the evidence suggests" value={r.refinedProblem.whatEvidenceSuggests} />
            <Fact label="Who is affected" value={r.refinedProblem.whoIsAffected} />
            <Fact label="What's in the way" value={r.refinedProblem.inTheWay} />
            <Fact label="Consequence" value={r.refinedProblem.consequence} />
          </dl>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
            <ConfidenceBadge level={r.refinedProblem.confidence} />
            <Cites ids={r.refinedProblem.findings} label="Based on" />
          </div>
        </div>
      </Block>

      <Block icon={<Database className="h-4 w-4 text-brand-600" />} title={`Findings (${r.findings.length})`}>
        {r.findings.length ? (
          <ul className="space-y-3">
            {r.findings.map((f) => {
              const derived = f.kind !== "observation";
              return (
                <li key={f.id} className={cn("rounded-xl border bg-surface p-4 shadow-card", derived ? "border-dashed border-brand-200" : "border-line")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-canvas px-1.5 text-[12px] font-semibold text-ink-muted">{f.id}</span>
                    <KindBadge kind={f.kind} />
                    <ConfidenceBadge level={f.confidence} />
                  </div>
                  <h4 className="mt-2 text-[14.5px] font-semibold leading-snug">{f.statement}</h4>
                  <p className="mt-1 text-[13px] text-ink-subtle">{f.confidenceReason}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-ink-subtle">
                    <span>
                      <span className="font-medium text-ink">From:</span>{" "}
                      {f.evidence.map((ref) => dataset(ref)?.name ?? ref).join(", ")}
                      {f.evidence.length === 1 && dataset(f.evidence[0])?.period ? ` · ${dataset(f.evidence[0])!.period}` : ""}
                    </span>
                    {f.basedOnFindings.length > 0 && <Cites ids={f.basedOnFindings} label="Builds on" />}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-faint">The data didn&rsquo;t support any findings.</p>
        )}
      </Block>

      {r.hypotheses.length > 0 && (
        <Block icon={<FlaskConical className="h-4 w-4 text-uncertain-600" />} title={`Hypotheses (${r.hypotheses.length})`}>
          <p className="-mt-1 mb-3 text-xs text-ink-subtle">Possible explanations. None has been tested yet.</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {r.hypotheses.map((h) => (
              <li key={h.id} className="rounded-xl border border-l-[3px] border-line border-l-uncertain-200 bg-surface p-4 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-dashed border-uncertain-600/50 px-1.5 text-[13px] font-semibold text-uncertain-600">{h.id}</span>
                  <KindBadge kind="hypothesis" />
                </div>
                <h4 className="mt-2 text-[14.5px] font-semibold leading-snug">{h.statement}</h4>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <EvidenceStrengthBadge strength={h.evidenceStrength} />
                  <ConfidenceBadge level={h.confidence} />
                </div>
                <p className="mt-3 text-[13px] text-ink-muted">{h.rationale}</p>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-muted">
                  <FlaskConical className="mt-px h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span>
                    <span className="font-medium text-ink">Validate by:</span> {h.validationMethod}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-ink-subtle">
                  <Cites ids={h.supportingFindings} label="Supported by" />
                  <Cites ids={h.contradictingFindings} label="Contradicted by" />
                </div>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {r.openQuestions.length > 0 && (
        <Block icon={<CircleHelp className="h-4 w-4 text-ink-faint" />} title={`What Veyra doesn't know (${r.openQuestions.length})`}>
          <ul className="space-y-2">
            {r.openQuestions.map((q) => (
              <li key={q.question} className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-[13px]">
                <p className="font-medium text-ink">{q.question}</p>
                <p className="mt-0.5 text-ink-muted">{q.whyItMatters}</p>
                <p className="mt-1 text-xs text-ink-subtle">
                  <span className="font-medium text-ink">Would be answered by:</span> {q.wouldBeAnsweredBy}
                </p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {r.opportunities.length > 0 && (
        <Block icon={<Lightbulb className="h-4 w-4 text-violet-700" />} title={`Opportunities to explore (${r.opportunities.length})`}>
          <p className="-mt-1 mb-3 text-xs text-ink-subtle">Directions, not solutions. They come after the problem is validated.</p>
          <ul className="space-y-2">
            {r.opportunities.map((o) => (
              <li key={o.title} className="rounded-lg border border-line bg-surface px-4 py-3 shadow-card">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold">{o.title}</p>
                  <ConfidenceBadge level={o.confidence} />
                </div>
                <p className="mt-1 text-[13px] text-ink-muted">{o.rationale}</p>
                <p className="mt-1.5 text-xs text-ink-subtle">
                  <Cites ids={o.findings} label="Based on" />
                </p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      <Block icon={<Route className="h-4 w-4 text-brand-600" />} title="Recommended next step">
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">{NEXT_STEP_LABELS[r.nextStep.type]}</p>
          <p className="mt-0.5 text-[15px] font-semibold">{r.nextStep.title}</p>
          <p className="mt-1 text-[13.5px] text-ink-muted">{r.nextStep.detail}</p>
          <dl className="mt-3 space-y-2 text-[13px]">
            <Fact label="Why" value={r.nextStep.why} />
            {r.nextStep.whyNotBuildYet.trim() && <Fact label="Why not build yet" value={r.nextStep.whyNotBuildYet} />}
            {r.nextStep.wouldChangeIf.length > 0 && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">This would change if</dt>
                <dd>
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-ink-muted">
                    {r.nextStep.wouldChangeIf.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </Block>

      {r.dataLimits.length > 0 && (
        <Block icon={<ShieldAlert className="h-4 w-4 text-uncertain-600" />} title="What this data can't show">
          <ul className="list-disc space-y-1 pl-5 text-[13px] text-ink-muted">
            {r.dataLimits.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Block>
      )}

      {run.removed.length > 0 && (
        <p className="rounded-lg bg-canvas px-3.5 py-2.5 text-xs text-ink-subtle">
          Veyra left out {run.removed.length} {run.removed.length === 1 ? "item" : "items"} that couldn&rsquo;t be traced back to your data.
        </p>
      )}
    </div>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink-faint">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

function Cites({ ids, label }: { ids: string[]; label: string }) {
  if (!ids.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="font-medium text-ink">{label}:</span>
      {ids.map((id) => (
        <span key={id} className="rounded bg-canvas px-1.5 text-[11.5px] font-semibold text-ink-muted">
          {id}
        </span>
      ))}
    </span>
  );
}
