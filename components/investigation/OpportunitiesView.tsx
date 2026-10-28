"use client";

import { LiveOpportunities } from "./LiveDiscovery";
import { useWorkspace } from "./workspace-context";

/** Opportunity areas that address the problem. */
export function OpportunitiesView() {
  const { workspace } = useWorkspace();
  return <LiveOpportunities live={workspace.live} />;
}
