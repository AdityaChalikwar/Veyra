"use client";

import { LiveValidation } from "./LiveValidation";
import { useWorkspace } from "./workspace-context";

/** Validation: Veyra tests each hypothesis and settles it. */
export function ValidationView() {
  const { workspace } = useWorkspace();
  return <LiveValidation live={workspace.live} />;
}
