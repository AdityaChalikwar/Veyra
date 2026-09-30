"use client";

import { CheckCircle2, CircleHelp, SearchX, TriangleAlert } from "lucide-react";
import { KindBadge } from "@/components/ui/KindBadge";
import { cn } from "@/lib/cn";
import type { ArtifactKind, DiagnosisItem } from "@/lib/types";
import { FindingChip } from "./ArtifactChips";

type Variant = "known" | "suspected" | "unknown" | "gap";

const config: Record<Variant, { title: string; kind: ArtifactKind; icon: typeof CheckCircle2; box: string; iconClass: string }> = {
  known: { title: "What we know", kind: "fact", icon: CheckCircle2, box: "border-line bg-surface", iconClass: "text-confirmed-600" },
  suspected: { title: "What we suspect", kind: "hypothesis", icon: TriangleAlert, box: "border-uncertain-200 bg-uncertain-50/40", iconClass: "text-uncertain-600" },
  unknown: { title: "What we don't know", kind: "unknown", icon: CircleHelp, box: "border-dashed border-line-strong bg-canvas/60", iconClass: "text-ink-faint" },
  gap: { title: "Evidence gaps", kind: "unknown", icon: SearchX, box: "border-dashed border-line-strong bg-surface", iconClass: "text-ink-subtle" },
};

/** One quadrant of the diagnosis. Each has its own look so facts, suspicions and unknowns never blur. */
export function DiagnosisSection({
  variant,
  items,
  footer,
}: {
  variant: Variant;
  items: (DiagnosisItem & { howToClose?: string })[];
  footer?: React.ReactNode;
}) {
  const c = config[variant];
  const Icon = c.icon;
  return (
    <section className={cn("rounded-xl border p-5 shadow-card", c.box)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">{c.title}</h2>
        {variant !== "gap" && <KindBadge kind={c.kind} />}
      </div>
      <ul className="mt-4 space-y-3.5">
        {items.map((item) => (
          <li key={item.text} className="flex gap-2.5">
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", c.iconClass)} />
            <div className="min-w-0 space-y-1.5">
              <p className="text-sm leading-relaxed text-ink">{item.text}</p>
              {item.howToClose && (
                <p className="text-xs text-ink-subtle">
                  <span className="font-medium text-ink-muted">To close it:</span> {item.howToClose}
                </p>
              )}
              {item.findingIds && item.findingIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.findingIds.map((id) => (
                    <FindingChip key={id} id={id} />
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  );
}
