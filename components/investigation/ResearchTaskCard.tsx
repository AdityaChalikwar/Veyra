"use client";

import { CheckCircle2, CircleHelp, FileText, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { ResearchTask } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

const priorityStyle = { high: "bg-danger-50 text-danger-600", medium: "bg-uncertain-50 text-uncertain-600", low: "bg-slate-100 text-slate-600" } as const;
const statusLabel = { "not-started": "Not started", "in-progress": "In progress", done: "Done" } as const;

/** A piece of research the investigation needs: the question it answers, how, and what it found. */
export function ResearchTaskCard({ task, index, compact }: { task: ResearchTask; index?: number; compact?: boolean }) {
  const { running, runResearch, openInterviewGuide } = useWorkspace();
  const busy = running[task.id];
  const done = task.status === "done";

  return (
    <article className={cn("rounded-xl border bg-surface shadow-card", done ? "border-confirmed-200" : "border-line", compact ? "p-4" : "p-5")}>
      <div className="flex items-start gap-3">
        {index !== undefined && (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{index}</span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] font-semibold leading-snug">{task.title}</h3>
          <p className="mt-1 flex items-start gap-1.5 text-[13px] text-ink-muted">
            <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <span>
              <span className="text-ink-subtle">Answers:</span> {task.question}
            </span>
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
            <Meta label="Method" value={task.method} />
            <div>
              <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Priority</dt>
              <dd>
                <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium capitalize", priorityStyle[task.priority])}>{task.priority}</span>
              </dd>
            </div>
            <Meta label="Status" value={busy ? "Running…" : statusLabel[task.status]} />
          </dl>

          {done && task.result && (
            <p className="mt-3 flex gap-2 rounded-lg bg-confirmed-50 px-3 py-2 text-[13px] text-ink">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-confirmed-600" />
              {task.result}
            </p>
          )}

          {!done && !compact && (
            <div className="mt-4">
              {task.method === "Customer interviews" ? (
                <Button type="button" variant="secondary" size="sm" onClick={openInterviewGuide}>
                  <FileText className="h-3.5 w-3.5" /> Generate Interview Guide
                </Button>
              ) : task.runnable ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => runResearch(task.id)} disabled={busy}>
                  {busy ? <Spinner /> : <Play className="h-3.5 w-3.5" />}
                  {busy ? "Running…" : task.method === "Competitor research" ? "Research competitors" : "Run analysis"}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
