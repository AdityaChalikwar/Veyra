"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatChange } from "@/lib/format";
import type { SegmentComparison } from "@/lib/types";
import { chartTheme as t, type TooltipProps } from "./chart-theme";

type Props = { rows: SegmentComparison[]; beforeLabel: string; afterLabel: string; unit: string };

/** Grouped before/after columns per segment, with the change printed under each group. */
export function SegmentChart({ rows, beforeLabel, afterLabel, unit }: Props) {
  const largest = Math.min(...rows.map((r) => r.change));
  return (
    <div className="h-[240px] w-full" role="img" aria-label={`Daily active users by segment, ${beforeLabel} versus ${afterLabel}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barGap={2} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={t.grid} />
          <XAxis
            dataKey="segment"
            tickLine={false}
            axisLine={{ stroke: t.grid }}
            interval={0}
            height={40}
            tick={({ x, y, payload, index }) => {
              const row = rows[index];
              const worst = row.change === largest;
              return (
                <g transform={`translate(${x},${y})`}>
                  <text y={14} textAnchor="middle" fontSize={11} fill={t.axis}>
                    {payload.value}
                  </text>
                  <text y={30} textAnchor="middle" fontSize={11.5} fontWeight={worst ? 700 : 500} fill={worst ? "#dc2626" : "#475569"}>
                    {formatChange(row.change)}
                  </text>
                </g>
              );
            }}
          />
          <YAxis tickFormatter={(v) => `${v}${unit}`} tickLine={false} axisLine={false} tick={t.tick} width={48} ticks={[0, 20, 40, 60, 80]} domain={[0, 80]} />
          <Tooltip
            cursor={{ fill: "#f1f3f9" }}
            content={(props) => <SegmentTooltip {...props} unit={unit} beforeLabel={beforeLabel} afterLabel={afterLabel} />}
          />
          <Bar dataKey="before" name={beforeLabel} fill={t.secondary} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          <Bar dataKey="after" name={afterLabel} fill={t.primary} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SegmentLegend({ beforeLabel, afterLabel }: { beforeLabel: string; afterLabel: string }) {
  return (
    <ul className="flex items-center gap-3 text-xs text-ink-subtle">
      <li className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.secondary }} aria-hidden="true" /> {beforeLabel}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.primary }} aria-hidden="true" /> {afterLabel}
      </li>
    </ul>
  );
}

function SegmentTooltip({
  active,
  payload,
  unit,
  beforeLabel,
  afterLabel,
}: TooltipProps & { unit: string; beforeLabel: string; afterLabel: string }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as SegmentComparison;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-raised">
      <p className="font-medium text-ink">{row.segment}</p>
      <p className="mt-1 flex justify-between gap-4 text-ink-muted">
        {beforeLabel} <span className="tabular-nums text-ink">{row.before}{unit}</span>
      </p>
      <p className="flex justify-between gap-4 text-ink-muted">
        {afterLabel} <span className="tabular-nums text-ink">{row.after}{unit}</span>
      </p>
      <p className="mt-1 flex justify-between gap-4 border-t border-line pt-1 text-ink-muted">
        Change <span className="font-semibold tabular-nums text-ink">{formatChange(row.change)}</span>
      </p>
    </div>
  );
}
