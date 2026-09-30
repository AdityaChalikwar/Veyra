"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { EvidenceCategory, EvidenceItem } from "@/lib/types";
import { EvidenceCard } from "./EvidenceCard";

type Filter = "all" | "company-data" | "research" | "other";

const sections: { title: string; filter: Exclude<Filter, "all">; categories: EvidenceCategory[] }[] = [
  { title: "Company Data", filter: "company-data", categories: ["company-data"] },
  { title: "Related Research", filter: "research", categories: ["research"] },
  { title: "Notes & Links", filter: "other", categories: ["notes", "other"] },
];

const filterLabels: Record<Filter, string> = {
  all: "All",
  "company-data": "Company Data",
  research: "Research",
  other: "Other",
};

/** The right-hand "Evidence & Data" panel: everything this investigation draws on. */
export function EvidencePanel({ evidence, onSelect }: { evidence: EvidenceItem[]; onSelect?: (item: EvidenceItem) => void }) {
  const [filter, setFilter] = useState<Filter>("all");

  const itemsFor = (categories: EvidenceCategory[]) => evidence.filter((e) => categories.includes(e.category));
  const count = (f: Filter) =>
    f === "all" ? evidence.length : itemsFor(sections.find((s) => s.filter === f)!.categories).length;
  const visible = sections.filter((s) => filter === "all" || s.filter === filter);

  return (
    <div className="px-3.5 pb-6 pt-5">
      <div role="tablist" aria-label="Evidence type" className="flex overflow-x-auto border-b border-line">
        {(Object.keys(filterLabels) as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            type="button"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "relative whitespace-nowrap px-[5px] pb-2 text-[11.5px] transition-colors",
              filter === f ? "font-medium text-brand-700" : "text-ink-subtle hover:text-ink",
            )}
          >
            {filterLabels[f]} <span className="tabular-nums text-ink-faint">({count(f)})</span>
            {filter === f && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-brand-600" aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className="mt-2 space-y-5">
        {visible.map((section) => {
          const items = itemsFor(section.categories);
          return (
            <section key={section.title}>
              {filter === "all" && (
                <h3 className="mb-1 mt-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{section.title}</h3>
              )}
              {items.length ? (
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.id}>
                      <EvidenceCard item={item} onSelect={onSelect} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-3 text-xs text-ink-faint">Nothing here yet.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
