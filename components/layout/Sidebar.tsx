"use client";

import {
  BookOpen,
  Brain,
  Building2,
  Database,
  FlaskConical,
  FolderSearch,
  Home,
  Lightbulb,
  ListChecks,
  Plus,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { statusLabel } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { InvestigationSummary } from "@/lib/types";
import { UserMenu } from "./UserMenu";

type NavItem = { href: string; label: string; icon: LucideIcon };

/** Navigation follows the discovery loop: discover → understand → decide → learn, on top of data. */
const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Discover",
    items: [
      { href: routes.investigations, label: "Investigations", icon: FolderSearch },
      { href: routes.research, label: "Research", icon: BookOpen },
      { href: routes.customers, label: "Customers", icon: UsersRound },
    ],
  },
  {
    label: "Understand",
    items: [
      { href: routes.problems, label: "Problems", icon: Target },
      { href: routes.opportunities, label: "Opportunities", icon: Lightbulb },
    ],
  },
  { label: "Decide", items: [{ href: routes.decisions, label: "Decisions", icon: ListChecks }] },
  {
    label: "Learn",
    items: [
      { href: routes.validation, label: "Validation", icon: FlaskConical },
      { href: routes.memory, label: "Business Memory", icon: Brain },
    ],
  },
  {
    label: "Data",
    items: [
      { href: routes.dataSources, label: "Data Sources", icon: Database },
      { href: routes.context, label: "Business Context", icon: Building2 },
    ],
  },
];

type Props = {
  investigations: InvestigationSummary[];
  /** Called after a link is chosen — the mobile drawer uses it to close itself. */
  onNavigate?: () => void;
};

export function Sidebar({ investigations, onNavigate }: Props) {
  const pathname = usePathname();
  const active = investigations.filter((i) => i.status !== "completed").slice(0, 4);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col bg-navy-900 text-navy-200">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo tone="light" href={routes.dashboard} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <NavLink href={routes.dashboard} icon={Home} label="Home" current={pathname === routes.dashboard} onNavigate={onNavigate} />
        <Link
          href={routes.newInvestigation}
          onClick={onNavigate}
          className="mt-2 flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-500"
        >
          <Plus className="h-4 w-4" /> New Investigation
        </Link>

        {groups.map((group) => (
          <div key={group.label} className="mt-4">
            <p className="mb-1 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-navy-300/80">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    {...item}
                    current={item.href === routes.investigations ? pathname === routes.investigations : isCurrent(item.href)}
                    onNavigate={onNavigate}
                  />
                  {item.href === routes.investigations && (
                    <ul className="ml-[21px] mt-0.5 space-y-0.5 border-l border-navy-700 pl-2">
                      {active.map((inv) => {
                        const current = isCurrent(routes.investigation(inv.id));
                        return (
                          <li key={inv.id}>
                            <Link
                              href={routes.investigation(inv.id)}
                              onClick={onNavigate}
                              aria-current={current ? "page" : undefined}
                              className={cn(
                                "block rounded-md px-2 py-1 transition-colors",
                                current ? "bg-navy-700 text-white" : "hover:bg-navy-800 hover:text-white",
                              )}
                            >
                              <span className="block truncate text-[13px] text-white">{inv.title}</span>
                              <span className="block truncate text-[11px] text-navy-300">{statusLabel[inv.status]}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-navy-700/70 p-3">
        <UserMenu />
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  current,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  current: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
        current ? "bg-navy-700 text-white" : "hover:bg-navy-800 hover:text-white",
      )}
    >
      <Icon className="h-[17px] w-[17px] shrink-0" />
      {label}
    </Link>
  );
}
