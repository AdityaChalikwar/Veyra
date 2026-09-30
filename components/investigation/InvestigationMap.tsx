import { cn } from "@/lib/cn";
import type { InvestigationMap as MapData, MapNode, MapSignal } from "@/lib/types";

const signalStyle: Record<MapSignal, { box: string; value: string; label: string }> = {
  problem: { box: "border-danger-200 bg-danger-50/70", value: "font-semibold text-danger-600", label: "Significant decline" },
  minor: { box: "border-line bg-surface", value: "text-ink-muted", label: "Minor change" },
  stable: { box: "border-line bg-surface", value: "text-ink-muted", label: "Stable" },
  event: { box: "border-brand-200 bg-brand-50/60", value: "text-brand-700", label: "Change event" },
  unknown: { box: "border-dashed border-line-strong bg-canvas", value: "italic text-ink-subtle", label: "Unknown" },
};

/**
 * The problem broken into lines of enquiry. Shows where Veyra is looking and
 * what it has — and hasn't — established on each branch.
 */
export function InvestigationMap({ map }: { map: MapData }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">Investigation Map</h2>
        <MapLegend />
      </div>

      <div className="mt-5">
        <div className="mx-auto w-fit rounded-lg bg-navy-900 px-6 py-2.5 text-center text-white shadow-raised">
          <p className="text-sm font-semibold">{map.root.label}</p>
          <p className="text-xs text-navy-200">{map.root.value}</p>
        </div>

        {/* Connectors: down from the root, across to each branch (desktop only). */}
        <div className="hidden md:block" aria-hidden="true">
          <div className="mx-auto h-5 w-px bg-line-strong" />
          <div className="mx-[16.667%] h-px bg-line-strong" />
        </div>

        <ul className="mt-4 grid gap-5 md:mt-0 md:grid-cols-3 md:gap-0">
          {map.branches.map((branch) => (
            <li key={branch.id} className="md:px-2">
              <div className="mx-auto hidden h-5 w-px bg-line-strong md:block" aria-hidden="true" />
              <div className="rounded-lg border border-line bg-surface px-3 py-2 text-center shadow-card">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-ink">{branch.label}</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-subtle">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", branch.uncertain ? "bg-uncertain-600" : "bg-ink-faint")}
                    aria-hidden="true"
                  />
                  {branch.assessment}
                </p>
              </div>
              <ul className="ml-5 mt-2 space-y-2 border-l border-line-strong pl-4">
                {branch.children.map((node) => (
                  <MapLeaf key={node.id} node={node} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MapLeaf({ node }: { node: MapNode }) {
  const style = signalStyle[node.signal];
  return (
    <li className="relative">
      <span className="absolute -left-4 top-1/2 h-px w-4 bg-line-strong" aria-hidden="true" />
      <div className={cn("flex items-center justify-between gap-2 rounded-lg border px-3 py-2", style.box)}>
        <span className="text-[13px] text-ink">{node.label}</span>
        <span className={cn("text-right text-xs", style.value)}>
          {node.value}
          <span className="sr-only"> ({style.label})</span>
        </span>
      </div>
    </li>
  );
}

function MapLegend() {
  const items: MapSignal[] = ["problem", "minor", "event", "unknown"];
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-subtle">
      {items.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm border", signalStyle[s].box)} aria-hidden="true" />
          {signalStyle[s].label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-uncertain-600" aria-hidden="true" /> Open question
      </li>
    </ul>
  );
}
