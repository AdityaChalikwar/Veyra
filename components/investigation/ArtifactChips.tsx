"use client";

import { FileSpreadsheet, FileText, Lightbulb, Link2 } from "lucide-react";
import type { EvidenceFormat } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

function EvidenceIcon({ format }: { format: EvidenceFormat }) {
  const className = "h-3 w-3 shrink-0";
  if (format === "csv" || format === "xlsx") return <FileSpreadsheet className={className} />;
  if (format === "link") return <Link2 className={className} />;
  return <FileText className={className} />;
}

/** A clickable reference to a piece of evidence. */
export function EvidenceChip({ id }: { id: string }) {
  const { workspace, openDetail } = useWorkspace();
  const item = workspace.evidence.find((e) => e.id === id);
  if (!item) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openDetail({ type: "evidence", id });
      }}
      className="inline-flex max-w-full items-center gap-1 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11.5px] text-ink-muted hover:border-brand-300 hover:text-brand-700"
    >
      <EvidenceIcon format={item.format} />
      <span className="truncate">{item.name}</span>
    </button>
  );
}

/** A clickable reference to a finding. */
export function FindingChip({ id }: { id: string }) {
  const { workspace, openDetail } = useWorkspace();
  const finding = workspace.findings.find((f) => f.id === id);
  if (!finding) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openDetail({ type: "finding", id });
      }}
      className="inline-flex max-w-full items-start gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-left text-xs text-ink-muted hover:border-brand-300 hover:text-brand-700"
    >
      <Lightbulb className="mt-px h-3 w-3 shrink-0 text-brand-600" />
      <span>
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{finding.kind}</span>
        {finding.statement}
      </span>
    </button>
  );
}
