/** Chart colours and axis styling, taken from the design tokens. */
export const chartTheme = {
  primary: "#4b48e3", // brand-600 — the series the story is about
  secondary: "#a5a9fc", // brand-300 — the comparison ("before") series
  grid: "#eceef4",
  axis: "#64748b", // ink-subtle
  annotation: "#94a3b8",
  declineWash: "#dc2626",
  surface: "#ffffff",
  tick: { fontSize: 11, fill: "#64748b" },
} as const;

/** The part of Recharts' tooltip props our custom tooltips read. */
export type TooltipProps = { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> };
