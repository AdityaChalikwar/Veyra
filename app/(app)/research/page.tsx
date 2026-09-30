import Link from "next/link";
import { EvidenceFormatIcon } from "@/components/evidence/EvidenceFormatIcon";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { listAllEvidence } from "@/lib/data";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";

export const metadata = { title: "Research Library" };

export default async function ResearchLibraryPage() {
  const research = (await listAllEvidence()).filter((e) => e.category === "research");
  return (
    <PageContainer>
      <PageHeader
        title="Research Library"
        description="Uploaded and industry research you can bring into any investigation. Veyra treats research as context, never as proof of what's happening in your business."
      />
      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {research.map((r) => (
          <li key={r.id} className="flex gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
            <EvidenceFormatIcon format={r.format} />
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-semibold leading-snug">{r.name}</h2>
              <p className="text-xs text-ink-subtle">
                {r.source} · {formatRelative(r.addedAt)}
              </p>
              {r.description && <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{r.description}</p>}
              <p className="mt-2 text-xs text-ink-subtle">
                Used in{" "}
                <Link href={routes.investigation(r.investigationId, "evidence")} className="font-medium text-brand-600 hover:text-brand-700">
                  {r.investigationTitle}
                </Link>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
