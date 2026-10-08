import { CalendarDays, CircleSlash, Clock, Compass, Database, FileText, Info, Sparkles, Upload } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { outcomeLabel, triggerLabel } from "@/lib/options";
import { formatDate, formatRelative } from "@/lib/time";
import type { DataSource, InvestigationRecord } from "@/lib/types";
import { AnalysisSection } from "./AnalysisSection";
import { AnswersEditor } from "./AnswersEditor";
import { DataUploader } from "./DataUploader";
import { DeleteInvestigationButton } from "./DeleteInvestigationButton";
import { DiscoveryStages } from "./DiscoveryStages";
import { EditInvestigationButton } from "./EditInvestigationButton";
import { UploadedEvidenceCard } from "./UploadedEvidenceCard";

/**
 * A saved investigation before any data is analysed: what the team told Veyra,
 * the questions it asked, and its plan. The full workspace (evidence, findings,
 * hypotheses…) takes over once analysis exists.
 */
export function InvestigationBrief({ record, dataSources }: { record: InvestigationRecord; dataSources: DataSource[] }) {
  const { summary: inv } = record;
  const sources = record.dataSourceIds.map((id) => dataSources.find((d) => d.id === id)).filter((d): d is DataSource => !!d);
  const unanswered = record.questions.filter((q) => !q.answer.trim()).length;
  const evidence = record.uploads.filter((u) => u.status === "ready");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-8">
      <header className="pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Investigation</p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">{inv.title}</h1>
          <EditInvestigationButton
            investigationId={inv.id}
            initial={{ title: inv.title, problem: inv.problem, objective: record.objective, trigger: record.trigger, outcome: record.outcome }}
          />
        </div>

        <div className="mt-3 rounded-xl border border-line bg-surface p-4 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Problem</p>
          <p className="mt-0.5 text-[15px] font-medium text-ink">&ldquo;{inv.problem}&rdquo;</p>
          {record.objective && (
            <p className="mt-2 text-[13.5px] text-ink-muted">
              <span className="font-medium text-ink">Objective:</span> {record.objective}
            </p>
          )}
          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-subtle">
            <div>
              <dt className="sr-only">Status</dt>
              <dd>
                <StatusBadge status={inv.status} />
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Created {formatDate(record.createdAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Updated {formatRelative(inv.updatedAt).toLowerCase()}
            </div>
          </dl>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Investigation progress</p>
          <DiscoveryStages stages={record.stages} />
          <div className="mt-2 flex gap-2.5 rounded-lg border border-brand-200 bg-brand-50/60 px-3.5 py-2.5 text-[13px] text-brand-700">
            {record.currentStage !== "add_data" ? <Sparkles className="mt-0.5 h-4 w-4 shrink-0" /> : <Upload className="mt-0.5 h-4 w-4 shrink-0" />}
            {record.currentStage === "add_data" ? (
              <p>
                <b className="font-semibold">Next: add data.</b> Upload a CSV export — for example events, signups, orders or support
                tickets — and Veyra will check what it contains and save it as evidence for this investigation.
              </p>
            ) : record.currentStage === "analysis" ? (
              <p>
                <b className="font-semibold">Next: analysis.</b> Veyra has {evidence.length === 1 ? "one dataset" : `${evidence.length} datasets`} to
                work with. Run the analysis below to get findings, hypotheses and a recommended next step.
              </p>
            ) : (
              <p>
                <b className="font-semibold">Next: problem validation.</b> The analysis is done. Its hypotheses are untested — the next step
                it recommends says how to start. Validation itself is the next part being built.
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          {record.currentStage !== "add_data" && (
            <AnalysisSection investigationId={inv.id} runs={record.analysisRuns} uploads={record.uploads} />
          )}

          <section id="evidence" className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[15px] font-semibold">Evidence</h2>
            <p className="mt-0.5 text-xs text-ink-subtle">
              Your own data. Veyra reads each file with plain calculations, so every number shown can be traced back to the file.
              The AI only reads these summaries; it never calculates.
            </p>
            <div className="mt-4">
              <DataUploader investigationId={inv.id} />
            </div>
            {record.uploads.length > 0 && (
              <div className="mt-4 space-y-3">
                {record.uploads.map((u) => (
                  <UploadedEvidenceCard key={u.fileId} upload={u} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[15px] font-semibold">Clarifying questions</h2>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {unanswered
                ? `${unanswered} unanswered — Veyra treats these as unknowns until you answer them.`
                : "All answered. You can still change your answers."}
            </p>
            {record.questions.length ? (
              <AnswersEditor investigationId={inv.id} questions={record.questions} />
            ) : (
              <p className="mt-3 text-[13px] text-ink-faint">No questions were asked for this investigation.</p>
            )}
          </section>

          <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <Compass className="h-4 w-4 text-brand-600" /> Investigation plan
            </h2>
            {record.plan ? (
              <>
                <p className="mt-1 text-[13px] text-ink-muted">{record.plan.summary}</p>
                <ol className="mt-4 space-y-2">
                  {record.plan.methods.map((m, i) => (
                    <li key={m.id} className="flex gap-3 rounded-lg bg-canvas px-3.5 py-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium">{m.name}</p>
                        <p className="text-[13px] text-ink-muted">{m.why}</p>
                        {m.uses?.length ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-subtle">
                            <Database className="h-3 w-3" /> {m.uses.join(" · ")}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
                {record.plan.notUsed.length > 0 && (
                  <>
                    <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-ink-faint">Not using — and why</h3>
                    <ul className="mt-2 space-y-1.5">
                      {record.plan.notUsed.map((n) => (
                        <li key={n.name} className="flex gap-2 text-[13px]">
                          <CircleSlash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
                          <span>
                            <span className="font-medium">{n.name}.</span> <span className="text-ink-muted">{n.why}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <p className="mt-2 text-[13px] text-ink-faint">No plan was saved for this investigation.</p>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[15px] font-semibold">Context</h2>
            <dl className="mt-3 space-y-3 text-[13px]">
              <Item label="Objective" value={record.objective || "Not given"} />
              <Item label="What triggered it" value={record.trigger ? triggerLabel(record.trigger) : "Not given"} />
              <Item label="Outcome wanted" value={record.outcome ? outcomeLabel(record.outcome) : "Not given"} />
              <Item label="What you already know" value={record.knownContext || "Nothing added"} />
            </dl>
          </section>

          <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[15px] font-semibold">Data sources</h2>
            {sources.length ? (
              <ul className="mt-3 space-y-1.5 text-[13px]">
                {sources.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-ink-faint" /> {s.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-ink-faint">None selected.</p>
            )}
            {record.attachments.length > 0 && (
              <>
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">Attached</h3>
                <ul className="mt-2 space-y-1.5 text-[13px]">
                  {record.attachments.map((a) => (
                    <li key={a} className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-ink-faint" /> {a}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-4 flex gap-1.5 text-xs text-ink-faint">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" /> Live connections to these tools come later. For now, upload exports from them as
              CSV files.
            </p>
          </section>

          <DeleteInvestigationButton investigationId={inv.id} title={inv.title} />
        </aside>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-ink">{value}</dd>
    </div>
  );
}
