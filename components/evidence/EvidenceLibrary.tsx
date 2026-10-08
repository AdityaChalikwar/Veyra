"use client";

import { Plus } from "lucide-react";
import { useWorkspace } from "@/components/investigation/workspace-context";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EvidenceCard } from "./EvidenceCard";
import { categoryAccent, categoryDescription, categoryLabel, categoryOrder } from "./evidence-categories";

/** The Evidence tab: everything the investigation draws on, grouped by provenance, and what relies on it. */
export function EvidenceLibrary() {
  const { workspace, openDetail, openAddEvidence } = useWorkspace();
  const usage = (id: string) =>
    workspace.findings.filter((f) => f.evidenceIds.includes(id)).length +
    workspace.hypotheses.filter((h) => h.supportingEvidenceIds?.includes(id) || h.contradictingEvidenceIds?.includes(id)).length;

  return (
    <div className="mt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-muted">
          {workspace.evidence.length} evidence sources. Company data and customer evidence come first; external research is kept separate
          and labelled by quality.
        </p>
        <Button type="button" size="sm" onClick={openAddEvidence}>
          <Plus className="h-4 w-4" /> Add Evidence
        </Button>
      </div>
      <div className="space-y-7">
        {categoryOrder.map((category) => {
          const items = workspace.evidence.filter((e) => e.category === category);
          if (!items.length) return null;
          return (
            <section key={category}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">{categoryLabel[category]}</h2>
                <p className="text-xs text-ink-subtle">{categoryDescription[category]}</p>
              </div>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {items.map((item) => {
                  const n = usage(item.id);
                  return (
                    <li key={item.id} className={cn("rounded-xl border border-l-[3px] border-line bg-surface p-2 shadow-card", categoryAccent[category])}>
                      <EvidenceCard item={item} onSelect={(e) => openDetail({ type: "evidence", id: e.id })} />
                      <p className="border-t border-line px-2 pb-1 pt-2 text-xs text-ink-subtle">
                        {n ? `Supports ${n} finding${n === 1 ? "" : "s"} or hypothes${n === 1 ? "is" : "es"}` : "Not linked to a finding yet"}
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
