"use client";

import { Loader2 } from "lucide-react";
import { useOptionalWorkspace } from "@/components/investigation/workspace-context";
import { formatRelative } from "@/lib/time";
import type { EvidenceItem } from "@/lib/types";
import { EvidenceFormatIcon } from "./EvidenceFormatIcon";

export function EvidenceCard({ item, onSelect }: { item: EvidenceItem; onSelect?: (item: EvidenceItem) => void }) {
  const ws = useOptionalWorkspace();
  const pending = ws?.workspace.proposals.filter((p) => p.evidenceId === item.id && p.status === "pending").length ?? 0;
  const body = (
    <>
      <EvidenceFormatIcon format={item.format} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13.5px] font-medium leading-snug text-ink">
          {item.name}
          {item.analysis?.status === "analysing" && (
            <span className="ml-1.5 inline-flex items-center gap-1 rounded bg-brand-50 px-1 align-[1px] text-[10px] font-semibold uppercase tracking-wide text-brand-700">
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> Analysing
            </span>
          )}
          {pending > 0 && (
            <span className="ml-1.5 inline-block rounded bg-uncertain-50 px-1 align-[1px] text-[10px] font-semibold uppercase tracking-wide text-uncertain-600">
              {pending} to review
            </span>
          )}
        </p>
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
