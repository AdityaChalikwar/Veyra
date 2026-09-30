"use client";

import { FlaskConical, Info } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { FindingChip } from "./ArtifactChips";
import { useWorkspace } from "./workspace-context";

export function HypothesisDetail({ id }: { id: string }) {
  const { workspace } = useWorkspace();
  const h = workspace.hypotheses.find((x) => x.id === id);
  if (!h) return <p className="p-5 text-sm text-ink-subtle">This hypothesis no longer exists.</p>;

  return (
    <div className="space-y-6 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind="hypothesis" />
          <ConfidenceBadge level={h.confidence} />
        </div>
        <p className="mt-3 text-lg font-semibold leading-snug">{h.statement}</p>
        <p className="mt-2 flex gap-2 rounded-lg bg-uncertain-50 px-3 py-2 text-xs text-uncertain-600">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          A hypothesis is a possible explanation, not an established fact. It stays open until it&rsquo;s tested.
        </p>
      </div>
      <Block title="Why Veyra is considering it">
        <p className="text-[13px] leading-relaxed text-ink">{h.rationale}</p>
      </Block>
      <Block title="Supporting findings">
        {h.supportingFindingIds.length ? (
          <div className="flex flex-col items-start gap-1.5">
            {h.supportingFindingIds.map((f) => (
              <FindingChip key={f} id={f} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-ink-faint">No findings support this yet.</p>
        )}
      </Block>
      <Block title="Challenging findings">
        {h.contradictingFindingIds.length ? (
          <div className="flex flex-col items-start gap-1.5">
            {h.contradictingFindingIds.map((f) => (
              <FindingChip key={f} id={f} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-ink-faint">Nothing challenges this so far.</p>
        )}
      </Block>
      {h.nextTest && (
        <Block title="How to test it">
          <p className="flex gap-2 text-[13px] leading-relaxed text-ink">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            {h.nextTest}
          </p>
        </Block>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</h3>
      {children}
    </section>
  );
}
