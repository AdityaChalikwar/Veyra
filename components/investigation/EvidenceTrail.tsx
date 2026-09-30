"use client";

import type { TrailStep } from "@/lib/types";
import { EvidenceChip } from "./ArtifactChips";

/** The step-by-step reasoning behind a conclusion, each step tied to its source. */
export function EvidenceTrail({ steps }: { steps: TrailStep[] }) {
  return (
    <ol className="relative space-y-3 border-l border-brand-200 pl-5">
      {steps.map((step, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[29px] top-0 grid h-[18px] w-[18px] place-items-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
            {i + 1}
          </span>
          <p className="text-[13px] leading-relaxed text-ink">{step.text}</p>
          {step.evidenceId && (
            <div className="mt-1">
              <EvidenceChip id={step.evidenceId} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
