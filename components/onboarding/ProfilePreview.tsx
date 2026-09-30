import { Building2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Row = { label: string; value?: string; active?: boolean };

/** Live summary of what Veyra has learned so far — a first glimpse of Business Memory. */
export function ProfilePreview({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Building2 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Business profile</p>
          <p className="text-xs text-ink-subtle">Builds as you answer</p>
        </div>
      </div>
      <dl className="mt-4 divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className={cn("shrink-0 whitespace-nowrap text-xs", row.active ? "font-medium text-brand-700" : "text-ink-subtle")}>{row.label}</dt>
            <dd className={cn("text-right text-[13px]", row.value ? "text-ink" : "text-ink-faint")}>
              {row.value || "Not set"}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-ink-subtle">
        Veyra uses this context in every investigation. You can change it anytime in Business Context.
      </p>
    </div>
  );
}
