import { EvidenceFormatIcon } from "@/components/evidence/EvidenceFormatIcon";
import { categoryLabel } from "@/components/evidence/evidence-categories";
import { formatRelative } from "@/lib/time";
import type { EvidenceWithContext } from "@/lib/types";

export function RecentEvidence({ items }: { items: EvidenceWithContext[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((e) => (
        <li key={e.id} className="flex items-center gap-3 py-3">
          <EvidenceFormatIcon format={e.format} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium text-ink">{e.name}</p>
            <p className="truncate text-xs text-ink-subtle">
              {e.source} · {categoryLabel[e.category]} · {e.investigationTitle}
            </p>
          </div>
          <span className="shrink-0 text-xs text-ink-faint">{formatRelative(e.addedAt)}</span>
        </li>
      ))}
    </ul>
  );
}
