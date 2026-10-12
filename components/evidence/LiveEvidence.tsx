"use client";

import { AnalysisSection } from "@/components/investigation/AnalysisSection";
import { DataUploader } from "@/components/investigation/DataUploader";
import { UploadedEvidenceCard } from "@/components/investigation/UploadedEvidenceCard";
import type { LiveInvestigation, SnapshotView } from "@/lib/types";
import { SourceEvidencePicker } from "./SourceEvidencePicker";

/** The Evidence tab of the team's own investigation: their uploads, what each contains, and the analysis over them. */
export function LiveEvidence({ investigationId, live, available }: { investigationId: string; live: LiveInvestigation; available: SnapshotView[] }) {
  const { uploads, analysisRuns, sourceEvidence } = live.record;
  return (
    <div className="mt-6 space-y-6">
      <SourceEvidencePicker investigationId={investigationId} added={sourceEvidence} available={available} />
      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-semibold">Uploaded files</h2>
        <p className="mt-0.5 text-xs text-ink-subtle">
          Veyra reads each file with plain calculations, so every number shown can be traced back to the file.
        </p>
        <div className="mt-4">
          <DataUploader investigationId={investigationId} />
        </div>
        {uploads.length > 0 && (
          <div className="mt-4 space-y-3">
            {uploads.map((u) => (
              <UploadedEvidenceCard key={u.fileId} upload={u} />
            ))}
          </div>
        )}
      </section>
      <AnalysisSection
        investigationId={investigationId}
        runs={analysisRuns}
        uploads={uploads}
        sourceEvidenceIds={sourceEvidence.map((e) => e.evidenceId)}
      />
    </div>
  );
}
