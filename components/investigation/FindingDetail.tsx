"use client";

import { AlertTriangle, CheckCircle2, CircleHelp, Route } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { EvidenceChip } from "./ArtifactChips";
import { EvidenceTrail } from "./EvidenceTrail";
import { useWorkspace } from "./workspace-context";

/** Drawer body for a finding: the numbers, what supports and contradicts it, what's unknown, and why. */
export function FindingDetail({ id }: { id: string }) {
  const { workspace, openDetail } = useWorkspace();
  const [showTrail, setShowTrail] = useState(false);
  const finding = workspace.findings.find((f) => f.id === id);
  if (!finding) return <p className="p-5 text-sm text-ink-subtle">This finding no longer exists.</p>;
  const d = finding.detail;
  const related = workspace.hypotheses.filter(
    (h) => h.supportingFindingIds.includes(id) || h.contradictingFindingIds.includes(id),
  );

  return (
    <div className="space-y-6 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind="finding" />
          <ConfidenceBadge level={finding.confidence} />
        </div>
        <p className="mt-3 text-lg font-semibold leading-snug">{finding.statement}</p>
        <p className="mt-1.5 text-[13px] text-ink-subtle">{finding.confidenceReason}</p>
      </div>

      <Section title="Evidence source">
        <div className="flex flex-wrap gap-1.5">
          {finding.evidenceIds.map((e) => (
            <EvidenceChip key={e} id={e} />
          ))}
        </div>
      </Section>

      {d && (
        <>
          <div>
            <p className="mb-2 text-xs font-medium text-ink-subtle">{d.metricLabel}</p>
            <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-line">
              <Stat label={d.before.label} value={d.before.value} />
              <Stat label={d.after.label} value={d.after.value} />
              <Stat label="Change" value={d.change} emphasis />
            </div>
          </div>

          <Section title="Supporting evidence">
            <List items={d.supporting} icon={<CheckCircle2 className="h-4 w-4 text-confirmed-600" />} empty="None recorded yet." />
          </Section>
          <Section title="Contradictory evidence">
            <List items={d.contradicting} icon={<AlertTriangle className="h-4 w-4 text-uncertain-600" />} empty="Nothing contradicts this so far." />
          </Section>
          <Section title="Unknown">
            <List items={d.unknowns} icon={<CircleHelp className="h-4 w-4 text-ink-faint" />} empty="No open questions." dashed />
          </Section>
        </>
      )}

      <div>
        <Button type="button" variant={showTrail ? "secondary" : "primary"} size="sm" onClick={() => setShowTrail((s) => !s)} aria-expanded={showTrail}>
          <Route className="h-3.5 w-3.5" /> {showTrail ? "Hide evidence trail" : "Why?"}
        </Button>
        {showTrail && (
          <div className="mt-4 rounded-xl bg-brand-50/50 p-4 pl-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">How Veyra reached this</p>
            <EvidenceTrail steps={finding.trail} />
          </div>
        )}
      </div>

      {related.length > 0 && (
        <Section title="Related hypotheses">
          <ul className="space-y-1.5">
            {related.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => openDetail({ type: "hypothesis", id: h.id })}
                  className="w-full rounded-lg border border-line px-3 py-2 text-left text-[13px] hover:border-brand-300"
                >
                  <KindBadge kind="hypothesis" className="mr-2" />
                  {h.statement}
                  <span className="ml-1 text-xs text-ink-faint">
                    ({h.supportingFindingIds.includes(id) ? "supports" : "challenges"})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</h3>
      {children}
    </section>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="border-r border-line px-3 py-2.5 last:border-r-0">
      <p className="text-[11px] text-ink-subtle">{label}</p>
      <p className={emphasis ? "text-lg font-semibold text-danger-600" : "text-lg font-semibold"}>{value}</p>
    </div>
  );
}

function List({ items, icon, empty, dashed }: { items: string[]; icon: React.ReactNode; empty: string; dashed?: boolean }) {
  if (!items.length) return <p className="text-[13px] text-ink-faint">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((text) => (
        <li
          key={text}
          className={
            dashed
              ? "flex gap-2.5 rounded-lg border border-dashed border-line-strong px-3 py-2 text-[13px]"
              : "flex gap-2.5 text-[13px] leading-relaxed"
          }
        >
          <span className="mt-0.5 shrink-0">{icon}</span>
          {text}
        </li>
      ))}
    </ul>
  );
}
