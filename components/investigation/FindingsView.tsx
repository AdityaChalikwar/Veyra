"use client";

import { CircleHelp } from "lucide-react";
import { KindBadge } from "@/components/ui/KindBadge";
import type { FindingKind } from "@/lib/types";
import { FindingCard } from "./FindingCard";
import { useWorkspace } from "./workspace-context";

const lanes: { kind: FindingKind; title: string; description: string }[] = [
  { kind: "observation", title: "Observations", description: "What the data directly shows." },
  { kind: "interpretation", title: "Interpretations", description: "What the evidence may indicate. Requires validation." },
  { kind: "insight", title: "Insights", description: "Patterns across several evidence sources." },
];

/** Findings, split so observations never blur with interpretation. Hypotheses have their own tab. */
export function FindingsView() {
  const { workspace } = useWorkspace();
  const open = workspace.openQuestions.filter((q) => !q.answeredByFindingId);

  return (
    <div className="mt-6 space-y-8">
      {lanes.map((lane) => {
        const items = workspace.findings.filter((f) => f.kind === lane.kind);
        if (!items.length) return null;
        return (
          <section key={lane.kind}>
            <div className="mb-3 flex items-baseline gap-2">
              <h2 className="text-[15px] font-semibold">{lane.title}</h2>
              <span className="text-xs text-ink-subtle">{lane.description}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {items.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </div>
          </section>
        );
      })}

      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold">Open questions</h2>
          <span className="text-xs text-ink-subtle">Important things Veyra doesn&rsquo;t know yet.</span>
        </div>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {open.map((q) => (
            <li key={q.id} className="rounded-xl border border-dashed border-line-strong bg-canvas/50 p-4">
              <KindBadge kind="open-question" />
              <p className="mt-2 flex gap-2 text-[14px] font-medium">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                {q.question}
              </p>
              <p className="mt-1 pl-6 text-[13px] text-ink-subtle">{q.whyItMatters}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
