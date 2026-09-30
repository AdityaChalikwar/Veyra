"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { EvidenceCategory, EvidenceItem } from "@/lib/types";
import { EvidenceCard } from "./EvidenceCard";
import { categoryAccent, categoryLabel, categoryOrder } from "./evidence-categories";

type Filter = "all" | "company" | "customer" | "research" | "other";

const filterCategories: Record<Exclude<Filter, "all">, EvidenceCategory[]> = {
  company: ["company-data"],
  customer: ["customer-evidence"],
  research: ["uploaded-research", "public-research"],
  other: ["notes"],
};

const filterLabels: Record<Filter, string> = { all: "All", company: "Company", customer: "Customer", research: "Research", other: "Other" };

/** The side panel's evidence list, grouped by provenance so sources never blend together. */
export function EvidencePanel({
  evidence,
  onSelect,
  onAdd,
}: {
  evidence: EvidenceItem[];
  onSelect?: (item: EvidenceItem) => void;
  onAdd?: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const visibleCategories = filter === "all" ? categoryOrder : filterCategories[filter];
  const count = (f: Filter) => (f === "all" ? evidence.length : evidence.filter((e) => filterCategories[f].includes(e.category)).length);

  return (
    <div className="px-3.5 pb-6 pt-4">
      {onAdd && (
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-xs text-ink-subtle">
            {evidence.length} source{evidence.length === 1 ? "" : "s"} in this investigation
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add Evidence
          </button>
        </div>
      )}
      <div role="tablist" aria-label="Evidence type" className="flex overflow-x-auto border-b border-line">
        {(Object.keys(filterLabels) as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            type="button"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "relative whitespace-nowrap px-[6px] pb-2 text-[11.5px] transition-colors",
              filter === f ? "font-medium text-brand-700" : "text-ink-subtle hover:text-ink",
            )}
          >
            {filterLabels[f]} <span className="tabular-nums text-ink-faint">({count(f)})</span>
            {filter === f && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-brand-600" aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-4">
        {visibleCategories.map((category) => {
          const items = evidence.filter((e) => e.category === category);
          if (!items.length) {
            return filter === "all" ? null : (
              <p key={category} className="px-2 py-3 text-xs text-ink-faint">
                No {categoryLabel[category].toLowerCase()} yet.
              </p>
            );
          }
          return (
            <section key={category}>
              <h3 className="mb-1 mt-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{categoryLabel[category]}</h3>
              <ul className={cn("space-y-0.5 border-l-2 pl-1", categoryAccent[category])}>
                {items.map((item) => (
                  <li key={item.id}>
                    <EvidenceCard item={item} onSelect={onSelect} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
