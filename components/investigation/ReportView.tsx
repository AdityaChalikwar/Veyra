"use client";

import { LiveBrief } from "./LiveBrief";
import { useWorkspace } from "./workspace-context";

/** The Decision Brief. */
export function ReportView() {
  const { workspace } = useWorkspace();
  return <LiveBrief live={workspace.live} />;
}
