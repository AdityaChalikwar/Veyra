"use client";

import { ChevronRight } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import type { Finding } from "@/lib/types";
import { EvidenceChip } from "./ArtifactChips";
import { useWorkspace } from "./workspace-context";

export function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const { openDetail } = useWorkspace();
  const open = () => openDetail({ type: "finding", id: finding.id });
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
      className="group cursor-pointer rounded-xl border border-line bg-surface p-5 shadow-card transition-shadow hover:border-line-strong hover:shadow-raised focus-visible:outline-2"
    >
      <div className="flex items-start gap-3.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-semibold text-brand-700">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind="finding" />
            <ConfidenceBadge level={finding.confidence} />
          </div>
          <h3 className="mt-2 text-[15px] font-semibold leading-snug">{finding.statement}</h3>
          <p className="mt-1 text-[13px] text-ink-subtle">{finding.confidenceReason}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-ink-faint">Evidence:</span>
            {finding.evidenceIds.map((id) => (
              <EvidenceChip key={id} id={id} />
            ))}
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </div>
    </article>
  );
}
