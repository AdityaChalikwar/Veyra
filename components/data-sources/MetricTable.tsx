import type { DataMetric } from "@/lib/types";

/** A metric worked out in code, shown as the small table it is. */
export function MetricTable({ metric: m }: { metric: DataMetric }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-ink">{m.title}</p>
      <div className="mt-1.5 max-h-72 overflow-auto rounded-lg border border-line">
        <table className="w-full text-left text-[12px] tabular-nums">
          <thead className="sticky top-0 bg-canvas text-ink-subtle">
            <tr>
              {m.columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-2.5 py-1.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.rows.map((row, i) => (
              <tr key={i} className="border-t border-line">
                {row.map((v, j) => (
                  <td key={j} className="whitespace-nowrap px-2.5 py-1 text-ink">
                    {typeof v === "number" ? v.toLocaleString("en", { maximumFractionDigits: 2 }) : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {m.note && <p className="mt-1 text-[11.5px] text-ink-faint">{m.note}</p>}
    </div>
  );
}
