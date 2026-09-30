"use client";

import { ArrowRight, Check, GitBranch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import type { Recommendation } from "@/lib/types";
import { EvidenceChip } from "./ArtifactChips";
import { LevelTiles } from "./LevelTiles";
import { useWorkspace } from "./workspace-context";

/** The recommended direction, with the evidence behind it and what would change it. */
export function RecommendationCard({ recommendation: r }: { recommendation: Recommendation }) {
  const { workspace, openDetail, decision, acceptRecommendation } = useWorkspace();
  const findings = workspace.findings.filter((f) => r.supportingFindingIds.includes(f.id));
  const accepted = decision?.recommendationId === r.id;

  return (
    <section className="rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind="recommendation" />
          <span className="text-xs text-ink-subtle">Recommended Direction</span>
        </div>
        <h2 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">{r.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">{r.rationale}</p>
        <div className="mt-5">
          <LevelTiles impact={r.impact} effort={r.effort} risk={r.risk} confidence={r.confidence} />
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Why?</h3>
          <p className="mt-1 text-xs text-ink-subtle">The findings this recommendation rests on.</p>
          <ul className="mt-3 space-y-2">
            {findings.map((f) => (
              <li key={f.id}>
                {/* A div, not a button: it contains evidence buttons, and buttons can't nest. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail({ type: "finding", id: f.id })}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openDetail({ type: "finding", id: f.id }))}
                  className="w-full cursor-pointer rounded-lg border border-line px-3.5 py-3 text-left transition-colors hover:border-brand-300"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <KindBadge kind="finding" />
                    <ConfidenceBadge level={f.confidence} />
                  </div>
                  <p className="mt-1.5 text-[13.5px] font-medium text-ink">{f.statement}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {f.evidenceIds.map((e) => (
                      <EvidenceChip key={e} id={e} />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">What could change this recommendation?</h3>
          <ul className="mt-3 space-y-2">
            {r.wouldChangeIf.map((c) => (
              <li key={c} className="flex gap-2.5 rounded-lg border border-dashed border-uncertain-200 bg-uncertain-50/50 px-3.5 py-3 text-[13.5px] text-ink">
                <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-uncertain-600" />
                &ldquo;{c}&rdquo;
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-lg bg-canvas p-4">
            {accepted ? (
              <p className="flex items-center gap-2 text-sm font-medium text-confirmed-600">
                <Check className="h-4 w-4" /> Accepted {formatRelative(decision!.decidedAt).toLowerCase()} and added to the Decision Log.
              </p>
            ) : (
              <p className="text-[13px] text-ink-muted">Ready to decide? Accepting records the decision and why it was made.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {!accepted && (
                <Button type="button" size="sm" onClick={() => acceptRecommendation(r.id)}>
                  <Check className="h-3.5 w-3.5" /> Accept recommendation
                </Button>
              )}
              <Link
                href={routes.investigation(workspace.investigation.id, "action-plan")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-canvas"
              >
                View action plan <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
