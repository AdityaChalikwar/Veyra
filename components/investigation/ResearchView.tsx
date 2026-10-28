"use client";

import { LiveResearch } from "./LiveResearch";
import { useWorkspace } from "./workspace-context";

/** Research Needed: tasks and open questions. */
export function ResearchView() {
  const { workspace } = useWorkspace();
  return <LiveResearch tasks={workspace.live.record.researchTasks} questions={workspace.openQuestions} approach={workspace.nextStep.approach} />;
}
