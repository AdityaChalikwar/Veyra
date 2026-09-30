"use client";

import { Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { DiagnosisSection } from "./DiagnosisSection";
import { useWorkspace } from "./workspace-context";

export function DiagnosisView() {
  const { workspace, openSide, sendMessage } = useWorkspace();
  const d = workspace.diagnosis;

  function askAboutGaps() {
    openSide("assistant");
    sendMessage("What evidence is missing?");
  }

  return (
    <div className="mt-6 space-y-4">
      <section className="flex gap-3.5 rounded-xl border border-line bg-surface p-5 shadow-card">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Stethoscope className="h-[18px] w-[18px]" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold">Current diagnosis</h2>
            <ConfidenceBadge level="medium-high" />
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{d.summary}</p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <DiagnosisSection variant="known" items={d.known} />
        <DiagnosisSection variant="suspected" items={d.suspected} />
        <DiagnosisSection variant="unknown" items={d.unknown} />
        <DiagnosisSection
          variant="gap"
          items={d.evidenceGaps}
          footer={
            <Button type="button" variant="secondary" size="sm" onClick={askAboutGaps}>
              <Sparkles className="h-3.5 w-3.5" /> Ask Veyra what&rsquo;s needed
            </Button>
          }
        />
      </div>
    </div>
  );
}
