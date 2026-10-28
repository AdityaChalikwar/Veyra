"use client";

import { LiveProblem } from "./LiveDiscovery";
import { useWorkspace } from "./workspace-context";

/** The problem definition. */
export function ProblemView() {
  const { workspace } = useWorkspace();
  return <LiveProblem live={workspace.live} />;
}
