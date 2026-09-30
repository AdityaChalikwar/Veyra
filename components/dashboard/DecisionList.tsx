import Link from "next/link";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import { decisionStatus as status } from "@/components/org/decision-status";
import type { DecisionRecord } from "@/lib/types";


export function DecisionList({ decisions }: { decisions: DecisionRecord[] }) {
  return (
    <ul className="divide-y divide-line">
      {decisions.map((d) => (
        <li key={d.id} className="py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13.5px] leading-snug text-ink">{d.decision}</p>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", status[d.status].className)}>
              {status[d.status].label}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-subtle">
            <Link href={routes.investigation(d.investigationId)} className="hover:text-brand-600">
              {d.investigationTitle}
            </Link>{" "}
            · {d.owner} · {formatRelative(d.decidedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
