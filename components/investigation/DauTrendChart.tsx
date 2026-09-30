"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";
import { chartTheme as t, type TooltipProps } from "./chart-theme";

type Props = { points: TrendPoint[]; unit: string; metric: string };

export function DauTrendChart({ points, unit, metric }: Props) {
  const event = points.find((p) => p.annotation);
  const last = points[points.length - 1];
  const format = (v: number) => `${v}${unit}`;

  return (
    <div className="h-[240px] w-full" role="img" aria-label={`${metric} by month, ${points[0].period} to ${last.period}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 24, right: 36, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke={t.grid} />
          {event && (
            <ReferenceArea x1={event.period} x2={last.period} fill={t.declineWash} fillOpacity={0.045} ifOverflow="extendDomain" />
          )}
          <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: t.grid }} tick={t.tick} dy={6} interval="preserveStartEnd" minTickGap={16} />
          <YAxis
            domain={[0, 140]}
            ticks={[0, 40, 80, 120]}
            tickFormatter={format}
            tickLine={false}
            axisLine={false}
            tick={t.tick}
            width={48}
          />
          {event && (
            <ReferenceLine
              x={event.period}
              stroke={t.annotation}
              label={{ value: event.annotation, position: "top", fill: "#475569", fontSize: 11, fontWeight: 500 }}
            />
          )}
          <Tooltip content={(props) => <TrendTooltip {...props} unit={unit} />} cursor={{ stroke: t.annotation, strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={t.primary}
            strokeWidth={2}
            strokeLinecap="round"
            dot={{ r: 4, fill: t.primary, stroke: t.surface, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: t.primary, stroke: t.surface, strokeWidth: 2 }}
            isAnimationActive={false}
            label={({ index, x, y }) =>
              index === points.length - 1 ? (
                <text key="end" x={Number(x) + 10} y={Number(y) + 4} fontSize={12} fontWeight={600} fill="#0f172a">
                  {format(last.value)}
                </text>
              ) : null
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendTooltip({ active, payload, unit }: TooltipProps & { unit: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as TrendPoint;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-raised">
      <p className="font-medium text-ink">Week of {point.period}</p>
      <p className="mt-0.5 text-ink-muted">
        DAU <span className="font-semibold tabular-nums text-ink">{point.value}{unit}</span>
      </p>
      {point.annotation && <p className="mt-1 text-ink-subtle">● {point.annotation}</p>}
    </div>
  );
}
