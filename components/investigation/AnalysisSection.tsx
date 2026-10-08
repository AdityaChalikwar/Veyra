"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { analyseInvestigation } from "@/app/(app)/investigations/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelative } from "@/lib/time";
import type { AnalysisRunRecord, UploadedEvidence } from "@/lib/types";
import { AnalysisView } from "./AnalysisView";

/** A run still "running" after this long died with its request (matches the server). */
const STALE_RUN_MS = 10 * 60 * 1000;

/**
 * Runs Veyra's analysis and shows the latest result. Results are stored, so
 * they're here after a refresh; a run in progress on another tab or after a
 * reload is picked up by checking back every few seconds.
 */
export function AnalysisSection({ investigationId, runs, uploads }: { investigationId: string; runs: AnalysisRunRecord[]; uploads: UploadedEvidence[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const latest = runs[0];
  const running = pending || (latest?.status === "running" && now - new Date(latest.createdAt).getTime() < STALE_RUN_MS);
  const lastGood = runs.find((r): r is AnalysisRunRecord & { result: NonNullable<AnalysisRunRecord["result"]> } => r.status === "completed" && !!r.result);
  const failed = latest && latest.status !== "completed" && latest.status !== "running" ? latest : undefined;

  const readyIds = uploads.filter((u) => u.status === "ready" && u.evidenceId).map((u) => u.evidenceId!);
  const analysedIds = new Set(lastGood?.datasets.map((d) => d.evidenceId));
  const stale = !!lastGood && (readyIds.some((id) => !analysedIds.has(id)) || [...analysedIds].some((id) => !readyIds.includes(id!)));

  // A run started elsewhere (or before a reload) finishes without this tab knowing; check back.
  const waitingOnOther = !pending && running;
  useEffect(() => {
    if (!waitingOnOther) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [waitingOnOther, router]);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await analyseInvestigation(investigationId);
      if ("error" in result) setError(result.error);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Sparkles className="h-4 w-4 text-brand-600" /> Analysis
          </h2>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Veyra reads the summary of each dataset and says what it shows, what it might mean and what is still unknown. Every number comes
            from your files, worked out by plain calculation; the AI only reads them.
          </p>
        </div>
        <Button size="sm" onClick={run} disabled={running || readyIds.length === 0} variant={lastGood && !stale ? "secondary" : "primary"}>
          {running ? <Spinner /> : <Sparkles className="h-3.5 w-3.5" />}
          {running ? "Analysing…" : lastGood ? "Analyse again" : "Analyse my data"}
        </Button>
      </div>

      {running && (
        <p role="status" className="mt-4 rounded-lg bg-brand-50/60 px-3.5 py-2.5 text-[13px] text-brand-700">
          Analysing {readyIds.length === 1 ? "your dataset" : `${readyIds.length} datasets`}. This usually takes a minute or two — you can leave this page and come back.
        </p>
      )}

      {(error || failed) && !running && (
        <p role="alert" className="mt-4 flex gap-2 rounded-lg border border-uncertain-200 bg-uncertain-50 px-3.5 py-2.5 text-[13px] text-uncertain-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error ?? failed?.error ?? "The last analysis didn't finish."}
        </p>
      )}

      {lastGood ? (
        <div className="mt-5">
          <p className="mb-4 text-xs text-ink-faint">
            Analysed {formatRelative(lastGood.completedAt ?? lastGood.createdAt).toLowerCase()} from {lastGood.datasets.map((d) => d.name).join(", ")}.
          </p>
          {stale && (
            <p className="mb-4 rounded-lg bg-uncertain-50 px-3.5 py-2.5 text-[13px] text-uncertain-600">
              Your data has changed since this analysis. Analyse again to include it.
            </p>
          )}
          <AnalysisView run={lastGood} />
        </div>
      ) : (
        !running && (
          <p className="mt-4 text-[13px] text-ink-faint">
            {readyIds.length === 0 ? "Add a dataset first." : "Not analysed yet. Veyra will turn your data into findings, hypotheses and a recommended next step."}
          </p>
        )
      )}
    </section>
  );
}
