"use client";

import { FileText, MessagesSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ResearchTaskCard } from "./ResearchTaskCard";
import { ComingNext } from "./ComingNext";
import { useWorkspace } from "./workspace-context";

/** What the investigation still needs to find out, and how. */
export function ResearchView() {
  const { workspace, running, runResearch, analyzeFeedback, openInterviewGuide } = useWorkspace();
  const tasks = [...workspace.researchTasks].sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0));
  const nextRunnable = workspace.researchTasks.find((t) => t.runnable && t.status === "not-started" && t.priority === "high");
  const feedbackDone = workspace.customers.themes.length > 0;

  if (workspace.live) {
    return (
      <ComingNext title="Research tools come next">
        <p>
          Interview guides, feedback themes and web research will run from here. What still needs finding out is listed below; each answer
          will come from research or new data.
        </p>
        {workspace.openQuestions.length ? (
          <ul className="space-y-2">
            {workspace.openQuestions.map((q) => (
              <li key={q.id} className="rounded-lg border border-line bg-surface px-3.5 py-2.5">
                <p className="text-[13.5px] font-medium text-ink">{q.question}</p>
                <p className="mt-0.5 text-[13px] text-ink-muted">{q.whyItMatters}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No open questions yet.</p>
        )}
      </ComingNext>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Research Needed</h2>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-subtle">
            Each item answers an open question. Veyra can run analyses on your connected data; interviews need people, so Veyra prepares them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={openInterviewGuide}>
            <FileText className="h-3.5 w-3.5" /> Generate Interview Guide
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={analyzeFeedback} disabled={feedbackDone || running.feedback}>
            {running.feedback ? <Spinner /> : <MessagesSquare className="h-3.5 w-3.5" />}
            {feedbackDone ? "Feedback analysed" : running.feedback ? "Analysing feedback…" : "Analyze Existing Feedback"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => nextRunnable && runResearch(nextRunnable.id)}
            disabled={!nextRunnable || running[nextRunnable.id]}
          >
            {nextRunnable && running[nextRunnable.id] ? <Spinner /> : <Search className="h-3.5 w-3.5" />}
            Investigate Further
          </Button>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {tasks.map((t, i) => (
          <li key={t.id}>
            <ResearchTaskCard task={t} index={i + 1} />
          </li>
        ))}
      </ol>
    </div>
  );
}
