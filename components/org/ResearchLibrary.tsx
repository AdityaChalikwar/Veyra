"use client";

import Link from "next/link";
import { EvidenceFormatIcon } from "@/components/evidence/EvidenceFormatIcon";
import { categoryAccent, categoryDescription, categoryLabel } from "@/components/evidence/evidence-categories";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import type { EvidenceCategory, EvidenceWithContext } from "@/lib/types";

const sections: EvidenceCategory[] = ["customer-evidence", "uploaded-research", "public-research"];

/** Research across investigations: customer research, uploaded reports and public research, kept apart. */
export function ResearchLibrary({ initial }: { initial: EvidenceWithContext[] }) {
  return (
    <>
      <p className="mt-6 text-[13px] text-ink-muted">
        Research documents come from your investigations: upload them on an investigation&rsquo;s Evidence tab.
      </p>
      {sections.map((category) => {
        const list = initial.filter((i) => i.category === category);
        return (
          <section key={category} className="mt-8">
            <h2 className="text-[15px] font-semibold">{categoryLabel[category]}</h2>
            <p className="mb-3 text-xs text-ink-subtle">{categoryDescription[category]}</p>
            {list.length ? (
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {list.map((r) => (
                  <li key={r.id} className={cn("flex gap-3 rounded-xl border border-l-[3px] border-line bg-surface p-4 shadow-card", categoryAccent[category])}>
                    <EvidenceFormatIcon format={r.format} />
                    <div className="min-w-0">
                      <h3 className="text-[14.5px] font-semibold leading-snug">{r.name}</h3>
                      <p className="text-xs text-ink-subtle">
                        {r.source} · {formatRelative(r.addedAt)}
                      </p>
                      {r.qualityNote && <p className="mt-1 text-xs text-uncertain-600">{r.qualityNote}</p>}
                      {r.description && <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{r.description}</p>}
                      {r.investigationId && (
                        <p className="mt-2 text-xs text-ink-subtle">
                          Used in{" "}
                          <Link href={routes.investigation(r.investigationId, "evidence")} className="font-medium text-brand-600 hover:text-brand-700">
                            {r.investigationTitle}
                          </Link>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-center text-[13px] text-ink-subtle">Nothing here yet.</p>
            )}
          </section>
        );
      })}
    </>
  );
}
