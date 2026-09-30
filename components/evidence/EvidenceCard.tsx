import { formatRelative } from "@/lib/time";
import type { EvidenceItem } from "@/lib/types";
import { EvidenceFormatIcon } from "./EvidenceFormatIcon";

export function EvidenceCard({ item, onSelect }: { item: EvidenceItem; onSelect?: (item: EvidenceItem) => void }) {
  const body = (
    <>
      <EvidenceFormatIcon format={item.format} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13.5px] font-medium leading-snug text-ink">{item.name}</p>
        <p className="mt-0.5 truncate text-xs text-ink-subtle">{item.source}</p>
        <p className="truncate text-xs text-ink-faint">
          {item.coverage ? `${item.coverage} · ` : ""}
          {formatRelative(item.addedAt)}
        </p>
      </div>
    </>
  );
  const className = "flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left";
  return onSelect ? (
    <button type="button" onClick={() => onSelect(item)} className={`${className} transition-colors hover:bg-canvas`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
