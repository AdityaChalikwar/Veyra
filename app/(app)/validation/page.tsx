import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { cn } from "@/lib/cn";
import { listValidations } from "@/lib/data";
import { routes } from "@/lib/routes";

export const metadata = { title: "Validation" };

const statusStyle = {
  "not-started": { label: "Not started", className: "bg-slate-100 text-slate-600" },
  running: { label: "In progress", className: "bg-brand-50 text-brand-700" },
  completed: { label: "Completed", className: "bg-confirmed-50 text-confirmed-600" },
} as const;

export default async function ValidationPage() {
  const validations = await listValidations();
  return (
    <PageContainer>
      <PageHeader
        title="Validation"
        description="Hypotheses under test and experiments across investigations. What's learned here flows into Business Memory."
      />
      <ul className="mt-8 space-y-3">
        {validations.map((v) => (
          <li key={`${v.investigationId}-${v.hypothesis}`} className="rounded-xl border border-line bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", statusStyle[v.status].className)}>{statusStyle[v.status].label}</span>
              <Link href={routes.investigation(v.investigationId, "validation")} className="text-xs text-ink-subtle hover:text-brand-600">
                {v.investigationTitle}
              </Link>
            </div>
            <p className="mt-2 text-[15px] font-semibold leading-snug">{v.hypothesis}</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              <span className="text-ink-subtle">Test:</span> {v.test}
            </p>
            {v.result && <p className="mt-2 rounded-lg bg-confirmed-50 px-3 py-2 text-[13px] text-ink">{v.result}</p>}
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
