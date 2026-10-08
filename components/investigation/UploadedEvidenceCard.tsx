"use client";

import { AlertTriangle, CalendarRange, ChevronDown, FileSpreadsheet, Rows3, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteUpload } from "@/app/(app)/investigations/actions";
import { Spinner } from "@/components/ui/Spinner";
import { formatNumber, formatRange } from "@/lib/analysis/format";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/time";
import type { ColumnProfile, ColumnType, UploadedEvidence } from "@/lib/types";

const typeLabel: Record<ColumnType, string> = {
  number: "Number",
  date: "Date",
  boolean: "Yes / no",
  category: "Category",
  identifier: "ID",
  text: "Text",
  empty: "Empty",
};

const sizeLabel = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/** One uploaded file: what Veyra found in it, column by column, and what to check. */
export function UploadedEvidenceCard({ upload: u }: { upload: UploadedEvidence }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const p = u.profile;

  async function remove() {
    if (!window.confirm(`Remove “${u.name}” and the evidence made from it?`)) return;
    setRemoving(true);
    await deleteUpload(u.fileId);
    router.refresh();
  }

  return (
    <article className={cn("rounded-xl border bg-surface shadow-card", u.status === "failed" ? "border-danger-200" : "border-line")}>
      <div className="flex items-start gap-3 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <FileSpreadsheet className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-[14.5px] font-semibold">{u.name}</h3>
            {u.status === "ready" && (
              <span className="rounded bg-confirmed-50 px-1.5 py-0.5 text-[11px] font-medium text-confirmed-600">Evidence</span>
            )}
            {(u.status === "uploading" || u.status === "processing") && (
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">Processing</span>
            )}
            {u.status === "failed" && (
              <span className="rounded bg-danger-50 px-1.5 py-0.5 text-[11px] font-medium text-danger-600">Couldn&rsquo;t read</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Uploaded CSV · {sizeLabel(u.sizeBytes)} · {formatRelative(u.addedAt)}
          </p>

          {u.status === "failed" && <p className="mt-2 text-[13px] text-danger-600">{u.error}</p>}
          {(u.status === "uploading" || u.status === "processing") && (
            <p className="mt-2 text-[13px] text-ink-subtle">
              This upload didn&rsquo;t finish being read. If it stays like this, remove it and upload the file again.
            </p>
          )}

          {p && (
            <>
              <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-ink-muted">
                  <Rows3 className="h-3.5 w-3.5 text-ink-faint" />
                  <dt className="sr-only">Size</dt>
                  <dd>
                    {p.rowCount.toLocaleString("en")} rows · {p.columnCount} columns
                  </dd>
                </div>
                <div className="flex items-center gap-1.5 text-ink-muted">
                  <CalendarRange className="h-3.5 w-3.5 text-ink-faint" />
                  <dt className="sr-only">Period</dt>
                  <dd>{u.coverage ? `${u.coverage} (${p.dateColumn})` : "No date column"}</dd>
                </div>
              </dl>
              {u.summary && <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{u.summary}</p>}

              {p.issues.length > 0 && (
                <div className="mt-3 rounded-lg border border-uncertain-200 bg-uncertain-50/60 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-uncertain-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> Check before relying on this
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12.5px] text-ink-muted">
                    {p.issues.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={removing}
          aria-label={`Remove ${u.name}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-canvas hover:text-danger-600"
        >
          {removing ? <Spinner /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>

      {p && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full items-center gap-1.5 border-t border-line px-4 py-2.5 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            {open ? "Hide columns and preview" : "Show columns and preview"}
          </button>
          {open && (
            <div className="space-y-4 border-t border-line p-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-faint">
                      <th className="py-1.5 pr-3 font-semibold">Column</th>
                      <th className="py-1.5 pr-3 font-semibold">Type</th>
                      <th className="py-1.5 pr-3 font-semibold">Filled</th>
                      <th className="py-1.5 font-semibold">What&rsquo;s in it</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.columns.map((c) => (
                      <tr key={c.name} className="border-b border-line align-top last:border-0">
                        <td className="py-1.5 pr-3 font-medium text-ink">{c.name}</td>
                        <td className="py-1.5 pr-3 text-ink-muted">{typeLabel[c.type]}</td>
                        <td className="py-1.5 pr-3 text-ink-muted">{p.rowCount ? Math.round((c.filled / p.rowCount) * 100) : 0}%</td>
                        <td className="py-1.5 text-ink-muted">{columnDetail(c, p.rowCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">First rows</p>
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-canvas">
                      <tr>
                        {p.preview.columns.map((c) => (
                          <th key={c} className="whitespace-nowrap px-2.5 py-1.5 font-semibold text-ink-muted">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.preview.rows.map((r, i) => (
                        <tr key={i} className="border-t border-line">
                          {r.map((v, j) => (
                            <td key={j} className="whitespace-nowrap px-2.5 py-1.5 text-ink">
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}

function columnDetail(c: ColumnProfile, rows: number): string {
  if (c.number) {
    const n = c.number;
    return `${formatNumber(n.min)} to ${formatNumber(n.max)} · average ${formatNumber(n.mean)} · total ${formatNumber(n.sum)}`;
  }
  if (c.date) return formatRange(c.date.from, c.date.to);
  if (c.top?.length) {
    const shown = c.top.slice(0, 4).map((t) => `${t.value} ${Math.round((t.count / rows) * 100)}%`);
    return shown.join(", ") + (c.distinct > 4 ? ` · ${c.distinct.toLocaleString("en")} values` : "");
  }
  if (c.type === "identifier") return `${c.distinct.toLocaleString("en")}${c.distinct >= 10_000 ? "+" : ""} different values`;
  if (c.type === "empty") return "No values";
  return `${c.distinct.toLocaleString("en")}${c.distinct >= 10_000 ? "+" : ""} different values`;
}
