"use client";

import { ExternalLink } from "lucide-react";
import { FindingChip } from "@/components/investigation/ArtifactChips";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { KindBadge } from "@/components/ui/KindBadge";
import { RelationBadge } from "@/components/investigation/EvidenceCitation";
import type { EvidenceLink, EvidenceRelation } from "@/lib/types";
import { useWorkspace } from "@/components/investigation/workspace-context";
import { formatRelative } from "@/lib/time";
import { categoryLabel } from "./evidence-categories";
import { EvidenceFormatIcon } from "./EvidenceFormatIcon";

/** The evidence viewer: what it is, how far to trust it, a preview, and everything that cites it. */
export function EvidenceDetail({ id }: { id: string }) {
  const { workspace, openDetail } = useWorkspace();
  const item = workspace.evidence.find((e) => e.id === id);
  if (!item) return <p className="p-5 text-sm text-ink-subtle">This evidence no longer exists.</p>;
  const usedBy = workspace.findings.filter(
    (f) => f.evidenceIds.includes(id) || f.evidenceLinks?.some((l) => l.evidenceId === id) || f.trail.some((s) => s.evidenceId === id),
  );
  const relationTo = (links: EvidenceLink[] | undefined, fallback: EvidenceRelation) => links?.find((l) => l.evidenceId === id)?.relation ?? fallback;
  const supports = workspace.hypotheses.filter(
    (h) => h.supportingEvidenceIds?.includes(id) || h.contradictingEvidenceIds?.includes(id) || h.insufficientEvidenceIds?.includes(id),
  );

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

      {item.analysis?.summary && (
        <section className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-700">Veyra&rsquo;s analysis</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-ink">{item.analysis.summary}</p>
        </section>
      )}

      {item.qualityNote && (
        <p className="rounded-lg border border-uncertain-200 bg-uncertain-50 px-3 py-2 text-xs text-uncertain-600">
          <b className="font-semibold">Public research — weaker evidence.</b> {item.qualityNote}
        </p>
      )}

      {item.confidence && (
        <section className="rounded-lg border border-line px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Evidence confidence</h3>
            <ConfidenceBadge level={item.confidence} bare />
          </div>
          {item.confidenceReason && <p className="mt-1.5 text-xs leading-relaxed text-ink-subtle">{item.confidenceReason}</p>}
        </section>
      )}

      <dl className="grid grid-cols-2 gap-3 text-[13px]">
        <Meta label="Source" value={item.source} />
        {item.dataset && <Meta label="Dataset" value={item.dataset} />}
        {item.coverage && <Meta label="Period" value={item.coverage} />}
        <Meta label="Added" value={formatRelative(item.addedAt)} />
        {item.format !== "dataset" && <Meta label="Format" value={item.format.toUpperCase()} />}
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
              <div key={f.id} className="flex flex-wrap items-start gap-1.5">
                <RelationBadge relation={relationTo(f.evidenceLinks, "supports")} />
                <FindingChip id={f.id} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-ink-faint">Not used by any finding yet.</p>
        )}
      </section>

      {supports.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Linked hypotheses</h3>
          <div className="flex flex-col items-start gap-1.5">
            {supports.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => openDetail({ type: "hypothesis", id: h.id })}
                className="w-full rounded-lg border border-line px-3 py-2 text-left text-[13px] hover:border-brand-300"
              >
                <KindBadge kind="hypothesis" className="mr-2" />
                {h.label}: {h.statement}
                <span className="ml-1.5 align-middle">
                  <RelationBadge relation={relationTo(h.evidenceLinks, h.supportingEvidenceIds?.includes(id) ? "supports" : "contradicts")} />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
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
