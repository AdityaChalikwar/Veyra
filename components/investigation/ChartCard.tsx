"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export type ChartTable = { caption: string; columns: string[]; rows: (string | number)[][] };

/**
 * Card around a chart: title, optional legend, a chart/table switch (so values
 * never depend on reading colour) and the evidence the chart comes from.
 */
export function ChartCard({
  title,
  legend,
  source,
  table,
  children,
}: {
  title: string;
  legend?: React.ReactNode;
  source?: string;
  table: ChartTable;
  children: React.ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <section className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <div className="flex items-center gap-3">
          {view === "chart" && legend}
          <div className="flex rounded-md border border-line p-0.5" role="group" aria-label="View">
            {(["chart", "table"] as const).map((v) => {
              const Icon = v === "chart" ? BarChart3 : Table2;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  aria-label={v === "chart" ? "Show chart" : "Show table"}
                  onClick={() => setView(v)}
                  className={cn("grid h-6 w-6 place-items-center rounded", view === v ? "bg-canvas text-ink" : "text-ink-faint hover:text-ink")}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex-1">
        {view === "chart" ? (
          children
        ) : (
          <table className="w-full text-left text-[13px]">
            <caption className="sr-only">{table.caption}</caption>
            <thead>
              <tr className="border-b border-line text-xs text-ink-subtle">
                {table.columns.map((c, i) => (
                  <th key={c} scope="col" className={cn("py-2 font-medium", i > 0 && "text-right")}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={String(row[0])} className="border-b border-line/70 last:border-0">
                  {row.map((cell, i) => (
                    <td key={i} className={cn("py-2", i > 0 && "text-right tabular-nums")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {source && <p className="mt-3 text-[11px] text-ink-faint">Source: {source}</p>}
    </section>
  );
}
