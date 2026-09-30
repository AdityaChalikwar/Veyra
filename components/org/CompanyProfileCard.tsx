"use client";

import { Building2, Pencil } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { useAppState } from "@/lib/store/app-store";
import type { Company } from "@/lib/types";

/** The business profile from onboarding (falls back to the demo company). */
export function CompanyProfileCard({ fallback }: { fallback: Company }) {
  const { company } = useAppState();
  const c = company ?? fallback;
  const rows: [string, string][] = [
    ["Company", c.name],
    ["What it does", c.description],
    ["Industry", c.industry],
    ["Size", `${c.size} employees`],
  ];
  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-[18px] w-[18px]" />
          </span>
          <h2 className="text-[15px] font-semibold">Company profile</h2>
        </div>
        <Link href={routes.onboarding} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
          <Pencil className="h-3 w-3" /> Update
        </Link>
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] text-ink-subtle">{label}</dt>
            <dd className="mt-0.5 text-sm text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
