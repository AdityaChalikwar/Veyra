"use client";

import { CircleHelp, FlaskConical, Info } from "lucide-react";
import Link from "next/link";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { EvidenceRoleBadge } from "@/components/ui/EvidenceRoleBadge";
import { EvidenceStrengthBadge } from "@/components/ui/EvidenceStrengthBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { routes } from "@/lib/routes";
import { EvidenceChip, FindingChip } from "./ArtifactChips";
import { useWorkspace } from "./workspace-context";

export function HypothesisDetail({ id }: { id: string }) {
  const { workspace } = useWorkspace();
  const h = workspace.hypotheses.find((x) => x.id === id);
  if (!h) return <p className="p-5 text-sm text-ink-subtle">This hypothesis no longer exists.</p>;
  const hasSupport = h.supportingFindingIds.length > 0 || (h.supportingEvidenceIds?.length ?? 0) > 0;
  const hasContra = h.contradictingFindingIds.length > 0 || (h.contradictingEvidenceIds?.length ?? 0) > 0;

  return (
    <div className="space-y-6 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind="hypothesis" />
          <span className="text-xs font-semibold text-ink-subtle">{h.label}</span>
        </div>
        <p className="mt-3 text-lg font-semibold leading-snug">{h.statement}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <EvidenceStrengthBadge strength={h.evidenceStrength} />
          <ConfidenceBadge level={h.confidence} />
        </div>
        <p className="mt-3 flex gap-2 rounded-lg bg-uncertain-50 px-3 py-2 text-xs text-uncertain-600">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          A hypothesis is a possible explanation, not an established fact. It stays open until it&rsquo;s tested.
        </p>
      </div>
      <Block title="Why Veyra is considering it">
        <p className="text-[13px] leading-relaxed text-ink">{h.rationale}</p>
      </Block>
      <Block title="Supporting evidence" badge={<EvidenceRoleBadge role="supporting" />}>
        {hasSupport ? (
          <div className="flex flex-col items-start gap-1.5">
            {h.supportingFindingIds.map((f) => (
              <FindingChip key={f} id={f} />
            ))}
            {h.supportingEvidenceIds?.map((e) => (
              <EvidenceChip key={e} id={e} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-ink-faint">No evidence supports this yet.</p>
        )}
      </Block>
      <Block title="Contradicting evidence" badge={<EvidenceRoleBadge role="contradicting" />}>
        {hasContra ? (
          <div className="flex flex-col items-start gap-1.5">
            {h.contradictingFindingIds.map((f) => (
              <FindingChip key={f} id={f} />
            ))}
            {h.contradictingEvidenceIds?.map((e) => (
              <EvidenceChip key={e} id={e} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-ink-faint">Nothing contradicts this so far.</p>
        )}
      </Block>
      <Block title="Open questions">
        <ul className="space-y-1.5">
          {h.openQuestions.map((q) => (
            <li key={q} className="flex gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2 text-[13px]">
              <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
              {q}
            </li>
          ))}
        </ul>
      </Block>
      <Block title="Recommended validation">
        <p className="flex gap-2 text-[13px] leading-relaxed text-ink">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          {h.validationMethod}
        </p>
        <Link href={routes.investigation(workspace.investigation.id, "validation")} className="mt-2 inline-block text-xs font-medium text-brand-600 hover:text-brand-700">
          View validation plan →
        </Link>
      </Block>
    </div>
  );
}

function Block({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {title} {badge}
      </h3>
      {children}
    </section>
  );
}
