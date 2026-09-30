"use client";

import { Plus } from "lucide-react";
import { useWorkspace } from "@/components/investigation/workspace-context";
import { Button } from "@/components/ui/Button";
import type { EvidenceCategory } from "@/lib/types";
import { EvidenceCard } from "./EvidenceCard";

const groups: { title: string; categories: EvidenceCategory[] }[] = [
  { title: "Company Data", categories: ["company-data"] },
  { title: "Research", categories: ["research"] },
  { title: "Notes, Links & Other", categories: ["notes", "other"] },
];

/** The Evidence tab: everything the investigation draws on, and which findings use it. */
export function EvidenceLibrary() {
  const { workspace, openDetail, openAddEvidence } = useWorkspace();
  const usage = (id: string) => workspace.findings.filter((f) => f.evidenceIds.includes(id)).length;

  return (
    <div className="mt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {workspace.evidence.length} pieces of evidence. Open one to preview it and see which findings rely on it.
        </p>
        <Button type="button" size="sm" onClick={openAddEvidence}>
          <Plus className="h-4 w-4" /> Add Evidence
        </Button>
      </div>
      <div className="space-y-6">
        {groups.map((g) => {
          const items = workspace.evidence.filter((e) => g.categories.includes(e.category));
          if (!items.length) return null;
          return (
            <section key={g.title}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">{g.title}</h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {items.map((item) => {
                  const n = usage(item.id);
                  return (
                    <li key={item.id} className="rounded-xl border border-line bg-surface p-2 shadow-card">
                      <EvidenceCard item={item} onSelect={(e) => openDetail({ type: "evidence", id: e.id })} />
                      <p className="border-t border-line px-2 pb-1 pt-2 text-xs text-ink-subtle">
                        {n ? `Used in ${n} finding${n === 1 ? "" : "s"}` : "Not used in findings yet"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
