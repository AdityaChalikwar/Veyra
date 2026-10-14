"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { shortPeriod, type ChartSpec } from "@/lib/analysis/charts";
import { chartTheme as t, niceScale, type TooltipProps } from "./chart-theme";

/**
 * Categorical slots in fixed order (checked for colour-blind separation): the
 * brand colour first, then orange, aqua, yellow. Never cycled — at most four lines.
 */
export const SERIES_COLORS = ["#4b48e3", "#eb6834", "#1baf7a", "#eda100"] as const;

const fmt = (v: number) => v.toLocaleString("en", { maximumFractionDigits: v < 100 ? 2 : 0 });

/** A worked-out trend from the evidence, one axis, up to four lines, end labels and a hover crosshair. */
export function MetricChart({ spec }: { spec: ChartSpec }) {
  const data = spec.periods.map((p, i) => ({ period: p, ...Object.fromEntries(spec.series.map((s) => [s.name, s.values[i]])) }));
  const scale = niceScale(Math.max(...spec.series.flatMap((s) => s.values.map((v) => v ?? 0))));
  const lastIndex = (values: (number | null)[]) => values.map((v) => v !== null).lastIndexOf(true);

  return (
    <div className="h-[240px] w-full" role="img" aria-label={`${spec.title}, ${shortPeriod(spec.periods[0])} to ${shortPeriod(spec.periods[spec.periods.length - 1])}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 56, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={t.grid} />
          <XAxis dataKey="period" tickFormatter={shortPeriod} tickLine={false} axisLine={{ stroke: t.grid }} tick={t.tick} dy={6} interval="preserveStartEnd" minTickGap={20} />
          <YAxis domain={[0, scale.top]} ticks={scale.ticks} tickFormatter={fmt} tickLine={false} axisLine={false} tick={t.tick} width={52} />
          <Tooltip content={(props) => <MetricTooltip {...props} spec={spec} />} cursor={{ stroke: t.annotation, strokeWidth: 1 }} />
          {spec.series.map((s, i) => {
            const end = lastIndex(s.values);
            const color = SERIES_COLORS[i];
            return (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 5, fill: color, stroke: t.surface, strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
                label={({ index, x, y }) =>
                  index === end ? (
                    <text key={`end-${s.name}`} x={Number(x) + 8} y={Number(y) + 4} fontSize={11} fontWeight={600} fill="#0f172a">
                      {fmt(s.values[end]!)}
                    </text>
                  ) : null
                }
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Legend for more than one line; a single line is named by the chart's title. */
export function MetricLegend({ spec }: { spec: ChartSpec }) {
  if (spec.series.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
      {spec.series.map((s, i) => (
        <li key={s.name} className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ background: SERIES_COLORS[i] }} aria-hidden="true" />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function MetricTooltip({ active, payload, spec }: TooltipProps & { spec: ChartSpec }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as Record<string, number | string | null>;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-raised">
      <p className="font-medium text-ink">{String(point.period)}</p>
      <ul className="mt-1 space-y-0.5">
        {spec.series.map((s, i) => (
          <li key={s.name} className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLORS[i] }} aria-hidden="true" />
            {s.name} <span className="ml-auto pl-3 font-semibold tabular-nums text-ink">{typeof point[s.name] === "number" ? fmt(point[s.name] as number) : "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
