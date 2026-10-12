"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RatePoint } from "@/lib/types";
import { chartTheme as t, niceScale, type TooltipProps } from "./chart-theme";

/** Muted comparison series: the baseline is context, the primary rate is the story. */
const CONTEXT = "#94a3b8";

type Props = { points: RatePoint[]; primaryLabel: string; secondaryLabel: string };

/** Two rates on one percentage axis — the one that changed (the story) against a stable baseline. */
export function RatesChart({ points, primaryLabel, secondaryLabel }: Props) {
  const event = points.find((p) => p.annotation);
  const last = points[points.length - 1];
  const scale = niceScale(Math.max(...points.flatMap((p) => [p.primary, p.secondary])));

  return (
    <div className="h-[240px] w-full" role="img" aria-label={`${primaryLabel} and ${secondaryLabel} over time`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 24, right: 40, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke={t.grid} />
          <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: t.grid }} tick={t.tick} dy={6} interval="preserveStartEnd" minTickGap={16} />
          <YAxis domain={[0, scale.top]} ticks={scale.ticks} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={t.tick} width={48} />
          {event && <ReferenceLine x={event.period} stroke={t.annotation} label={{ value: event.annotation, position: "top", fill: "#475569", fontSize: 11, fontWeight: 500 }} />}
          <Tooltip content={(props) => <RatesTooltip {...props} primaryLabel={primaryLabel} secondaryLabel={secondaryLabel} />} cursor={{ stroke: t.annotation, strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="secondary"
            stroke={CONTEXT}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: CONTEXT, stroke: t.surface, strokeWidth: 2 }}
            isAnimationActive={false}
            label={({ index, x, y }) =>
              index === points.length - 1 ? (
                <text key="s-end" x={Number(x) + 8} y={Number(y) + 4} fontSize={12} fontWeight={600} fill="#475569">
                  {last.secondary}%
                </text>
              ) : null
            }
          />
          <Line
            type="monotone"
            dataKey="primary"
            stroke={t.primary}
            strokeWidth={2}
            dot={{ r: 3.5, fill: t.primary, stroke: t.surface, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: t.primary, stroke: t.surface, strokeWidth: 2 }}
            isAnimationActive={false}
            label={({ index, x, y }) =>
              index === points.length - 1 ? (
                <text key="p-end" x={Number(x) + 8} y={Number(y) + 4} fontSize={12} fontWeight={600} fill="#0f172a">
                  {last.primary}%
                </text>
              ) : null
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RatesLegend({ primaryLabel, secondaryLabel }: { primaryLabel: string; secondaryLabel: string }) {
  return (
    <ul className="flex flex-wrap items-center gap-3 text-xs text-ink-subtle">
      <li className="flex items-center gap-1.5">
        <span className="h-0.5 w-3.5 rounded-full" style={{ background: t.primary }} aria-hidden="true" /> {primaryLabel}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-0.5 w-3.5 rounded-full" style={{ background: CONTEXT }} aria-hidden="true" /> {secondaryLabel}
      </li>
    </ul>
  );
}

function RatesTooltip({ active, payload, primaryLabel, secondaryLabel }: TooltipProps & { primaryLabel: string; secondaryLabel: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as RatePoint;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-raised">
      <p className="font-medium text-ink">Week of {p.period}</p>
      <p className="mt-0.5 flex justify-between gap-4 text-ink-muted">
        {primaryLabel} <span className="font-semibold tabular-nums text-ink">{p.primary}%</span>
      </p>
      <p className="flex justify-between gap-4 text-ink-muted">
        {secondaryLabel} <span className="font-semibold tabular-nums text-ink">{p.secondary}%</span>
      </p>
      {p.annotation && <p className="mt-1 text-ink-subtle">● {p.annotation}</p>}
    </div>
  );
}
