"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { WORKSPACE_TABS } from "./tabs";

export function WorkspaceTabs({ investigationId }: { investigationId: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Investigation sections" className="-mx-4 overflow-x-auto border-b border-line px-4 sm:-mx-8 sm:px-8">
      <ul className="flex min-w-max gap-0.5">
        {WORKSPACE_TABS.map((tab) => {
          const href = routes.investigation(investigationId, tab.slug || undefined);
          const current = pathname === href;
          return (
            <li key={tab.label}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative block whitespace-nowrap px-2.5 py-3 text-[13px] transition-colors",
                  current ? "font-medium text-brand-700" : "text-ink-subtle hover:text-ink",
                )}
              >
                {tab.label}
                {current && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
