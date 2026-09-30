"use client";

import { ExternalLink, Info } from "lucide-react";
import { FindingChip } from "@/components/investigation/ArtifactChips";
import { useWorkspace } from "@/components/investigation/workspace-context";
import { formatRelative } from "@/lib/time";
import { EvidenceFormatIcon } from "./EvidenceFormatIcon";

const categoryLabel = { "company-data": "Company data", research: "Research", notes: "Notes & links", other: "Other" };

export function EvidenceDetail({ id }: { id: string }) {
  const { workspace } = useWorkspace();
  const item = workspace.evidence.find((e) => e.id === id);
  if (!item) return <p className="p-5 text-sm text-ink-subtle">This evidence no longer exists.</p>;
  const usedBy = workspace.findings.filter((f) => f.evidenceIds.includes(id) || f.trail.some((s) => s.evidenceId === id));

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-start gap-3">
        <EvidenceFormatIcon format={item.format} className="h-11 w-11" />
        <div className="min-w-0">
          <p className="break-words text-base font-semibold leading-snug">{item.name}</p>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {categoryLabel[item.category]} · {item.source}
          </p>
        </div>
      </div>

      {item.analysed === false && (
        <p className="flex gap-2 rounded-lg bg-uncertain-50 px-3 py-2 text-xs text-uncertain-600">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          Added, but not analysed yet. Findings don&rsquo;t use it until it has been analysed.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 text-[13px]">
        {item.coverage && <Meta label="Covers" value={item.coverage} />}
        <Meta label="Added" value={formatRelative(item.addedAt)} />
        <Meta label="Format" value={item.format.toUpperCase()} />
      </dl>

      {item.description && <p className="text-[13px] leading-relaxed text-ink">{item.description}</p>}
      {item.url && (
        <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
          Open link <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {item.preview && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Preview</h3>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left font-mono text-[11.5px]">
              <thead className="bg-canvas text-ink-subtle">
                <tr>
                  {item.preview.columns.map((c) => (
                    <th key={c} className="px-3 py-1.5 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.preview.rows.map((row, i) => (
                  <tr key={i} className="border-t border-line">
                    {row.map((cell, j) => (
                      <td key={j} className="whitespace-nowrap px-3 py-1.5 text-ink">
                        {typeof cell === "number" ? cell.toLocaleString("en-GB") : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-faint">Sample rows only.</p>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Used in findings</h3>
        {usedBy.length ? (
          <div className="flex flex-col items-start gap-1.5">
            {usedBy.map((f) => (
              <FindingChip key={f.id} id={f.id} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-ink-faint">Not used by any finding yet.</p>
        )}
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
