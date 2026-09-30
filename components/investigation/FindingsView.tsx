"use client";

import { FindingCard } from "./FindingCard";
import { useWorkspace } from "./workspace-context";

export function FindingsView() {
  const { workspace } = useWorkspace();
  return (
    <div className="mt-6 max-w-3xl">
      <p className="mb-4 text-sm text-ink-muted">
        What the evidence shows so far. Open a finding to see the numbers, what contradicts it and how Veyra got there.
      </p>
      <div className="space-y-3">
        {workspace.findings.map((f, i) => (
          <FindingCard key={f.id} finding={f} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
