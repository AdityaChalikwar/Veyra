import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import type { DataSource } from "@/lib/types";

/** The company systems Veyra investigates — shown up front so Veyra reads as a layer over real data. */
export function ConnectedData({ sources }: { sources: DataSource[] }) {
  const connected = sources.filter((s) => s.status === "connected" && s.group !== "external");
  return (
    <section className="rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5" aria-labelledby="connected-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="connected-heading" className="text-[15px] font-semibold">
            Evidence Veyra can investigate
          </h2>
          <p className="text-xs text-ink-subtle">{connected.length} company and customer sources connected</p>
        </div>
        <Link href={routes.dataSources} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
          Manage data <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {connected.map((s) => (
          <li key={s.id} className="flex items-center gap-2 rounded-lg border border-line bg-canvas/60 px-2.5 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-confirmed-600" />
            <span className="text-[13px] font-medium text-ink">{s.name}</span>
            {s.lastSyncedAt && <span className="text-[11px] text-ink-faint">{formatRelative(s.lastSyncedAt)}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
