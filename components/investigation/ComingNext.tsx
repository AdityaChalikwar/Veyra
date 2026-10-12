import { Clock } from "lucide-react";

/**
 * Shown on the team's own investigations where a part of the product isn't
 * connected to real data yet, so nothing simulated is mistaken for theirs.
 */
export function ComingNext({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-dashed border-line-strong bg-canvas/50 p-6">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Clock className="h-4 w-4 text-ink-subtle" /> {title}
      </p>
      <div className="mt-1.5 max-w-2xl space-y-3 text-[13.5px] text-ink-muted">{children}</div>
    </section>
  );
}
