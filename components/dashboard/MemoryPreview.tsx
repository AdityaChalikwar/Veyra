import { cn } from "@/lib/cn";
import type { MemoryCategory, MemoryEntry } from "@/lib/types";

const categoryStyle: Partial<Record<MemoryCategory, { label: string; className: string }>> = {
  learnings: { label: "Learning", className: "bg-confirmed-50 text-confirmed-600" },
  experiments: { label: "Experiment", className: "bg-violet-50 text-violet-700" },
  segments: { label: "Segment", className: "bg-brand-50 text-brand-700" },
  decisions: { label: "Decision", className: "bg-brand-50 text-brand-700" },
};

export function MemoryPreview({ entries }: { entries: MemoryEntry[] }) {
  return (
    <ul className="divide-y divide-line">
      {entries.map((m) => {
        const cat = categoryStyle[m.category] ?? { label: m.category, className: "bg-slate-100 text-slate-600" };
        return (
          <li key={m.id} className="py-3">
            <span className={cn("rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider", cat.className)}>
              {cat.label}
            </span>
            <p className="mt-1.5 text-[13.5px] leading-snug text-ink">{m.title}</p>
            {m.sourceInvestigationTitle && <p className="mt-0.5 text-xs text-ink-subtle">From {m.sourceInvestigationTitle}</p>}
          </li>
        );
      })}
    </ul>
  );
}
