"use client";

import { formatDate, formatRelative } from "@/lib/time";
import { OUTCOME_LABEL } from "@/lib/brief/build";
import type { LiveInvestigation } from "@/lib/types";

type Event = { at: string; text: string; by?: "veyra" | "team" };

/** Everything that happened in the investigation, newest first, from its records. */
export function ActivityTimeline({ live }: { live: LiveInvestigation }) {
  const r = live.record;
  const label = (title: string, statement: string) => `“${title || statement.slice(0, 80)}”`;
  const events: Event[] = [
    { at: r.createdAt, text: "Investigation started", by: "team" as const },
    ...r.uploads.filter((u) => u.status === "ready").map((u) => ({ at: u.addedAt, text: `Added data: ${u.name}`, by: "team" as const })),
    ...r.sourceEvidence.map((e) => ({ at: e.addedAt, text: `Added data from ${e.source}: ${e.name}` })),
    ...r.analysisRuns.flatMap((a) =>
      a.status === "completed" && a.completedAt
        ? [{ at: a.completedAt, text: "Analysed the data: findings, hypotheses and research", by: "veyra" as const }]
        : a.status !== "running"
          ? [{ at: a.completedAt ?? a.createdAt, text: "An analysis didn't finish", by: "veyra" as const }]
          : [],
    ),
    ...(r.problemDefinition
      ? [
          {
            at: r.problemDefinition.createdAt,
            text: `Defined the problem (${r.problemDefinition.causeStatus === "validated" ? "cause validated" : "provisional"})`,
            by: "veyra" as const,
          },
        ]
      : []),
    ...r.validations.flatMap((v) => [
      ...(v.run ? [{ at: v.run.createdAt, text: `Veyra started validating ${label(v.hypothesisTitle, v.hypothesisStatement)}`, by: "veyra" as const }] : []),
      ...(v.status === "settled" && v.settledAt
        ? [
            {
              at: v.settledAt,
              text: `${label(v.hypothesisTitle, v.hypothesisStatement)} settled: ${v.outcome}${v.confidence ? ` (${v.confidence} confidence)` : ""}`,
              by: v.settledBy,
            },
          ]
        : []),
    ]),
    ...r.researchTasks.filter((t) => t.status === "done").map((t) => ({ at: t.updatedAt, text: `Research finished: ${t.title}`, by: "team" as const })),
    ...(r.brief ? [{ at: r.brief.createdAt, text: `Wrote the Decision Brief: ${OUTCOME_LABEL[r.brief.content.recommendation.outcome].toLowerCase()}`, by: "veyra" as const }] : []),
    ...r.decisions.map((d) => ({ at: d.createdAt, text: `Decided: ${d.summary}`, by: "team" as const })),
    ...r.notes.map((n) => ({ at: n.createdAt, text: `Note by ${n.author}`, by: "team" as const })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section className="mt-10">
      <h2 className="text-[15px] font-semibold">Activity</h2>
      <p className="mt-0.5 text-[13px] text-ink-subtle">Everything that has happened in this investigation, newest first.</p>
      <ol className="mt-4 border-l border-line pl-5">
        {events.map((e, i) => (
          <li key={`${e.at}-${i}`} className="relative pb-4">
            <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ${e.by === "veyra" ? "bg-brand-500" : "bg-ink-faint"}`} />
            <p className="text-[13.5px] text-ink">{e.text}</p>
            <p className="text-xs text-ink-subtle" title={formatDate(e.at)}>
              {e.by === "veyra" ? "Veyra" : e.by === "team" ? "The team" : "Data"} · {formatRelative(e.at)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
