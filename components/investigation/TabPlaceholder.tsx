import { Hammer } from "lucide-react";

export function TabPlaceholder({ label, milestone }: { label: string; milestone: number }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-canvas text-ink-subtle">
        <Hammer className="h-5 w-5" />
      </span>
      <p className="mt-4 font-medium">{label} is built in Milestone {milestone}.</p>
    </div>
  );
}
