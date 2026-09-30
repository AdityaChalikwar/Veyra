"use client";

import {
  BookOpen,
  Brain,
  Building2,
  Database,
  Home,
  ListChecks,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { TopicIcon } from "@/components/investigation/TopicIcon";
import { statusLabel } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { InvestigationSummary } from "@/lib/types";
import { UserMenu } from "./UserMenu";

const workspaceLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: routes.context, label: "Business Context", icon: Building2 },
  { href: routes.dataSources, label: "Data Sources", icon: Database },
  { href: routes.research, label: "Research Library", icon: BookOpen },
  { href: routes.decisions, label: "Decision Log", icon: ListChecks },
  { href: routes.memory, label: "Business Memory", icon: Brain },
  { href: routes.settings, label: "Settings", icon: Settings },
];

type Props = {
  investigations: InvestigationSummary[];
  /** Called after a link is chosen — the mobile drawer uses it to close itself. */
  onNavigate?: () => void;
};

export function Sidebar({ investigations, onNavigate }: Props) {
  const pathname = usePathname();
  const active = investigations.filter((i) => i.status !== "completed");
  const completed = investigations.filter((i) => i.status === "completed");

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
          className="mt-3 flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-500"
        >
          <Plus className="h-4 w-4" /> New Investigation
        </Link>

        <p className="mt-5 px-2 text-[13px] font-semibold text-white">Investigations</p>
        <GroupLabel>Active</GroupLabel>
        <ul className="space-y-0.5">
          {active.map((inv) => (
            <InvestigationLink
              key={inv.id}
              investigation={inv}
              current={isCurrent(routes.investigation(inv.id))}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
        <GroupLabel>Completed</GroupLabel>
        <ul className="space-y-0.5">
          {completed.map((inv) => (
            <InvestigationLink
              key={inv.id}
              investigation={inv}
              current={isCurrent(routes.investigation(inv.id))}
              onNavigate={onNavigate}
            />
          ))}
        </ul>

        <div className="my-3 border-t border-navy-700/70" />
        <ul className="space-y-0.5">
          {workspaceLinks.map((l) => (
            <li key={l.href}>
              <NavLink {...l} current={isCurrent(l.href)} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 border-t border-navy-700/70 p-3">
        <UserMenu />
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 mt-2.5 px-2 text-[11px] font-medium uppercase tracking-wider text-navy-300/80">{children}</p>;
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
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {label}
    </Link>
  );
}

function InvestigationLink({
  investigation: inv,
  current,
  onNavigate,
}: {
  investigation: InvestigationSummary;
  current: boolean;
  onNavigate?: () => void;
}) {
  const meta = inv.status === "completed" ? statusLabel.completed : `${statusLabel[inv.status]} · ${inv.progress}%`;
  return (
    <li>
      <Link
        href={routes.investigation(inv.id)}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors",
          current ? "bg-navy-700" : "hover:bg-navy-800",
        )}
      >
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-md",
            current ? "bg-brand-600 text-white" : "bg-navy-800 text-navy-300",
          )}
        >
          <TopicIcon topic={inv.topic} className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-medium text-white">{inv.title}</span>
          <span className="block truncate text-xs text-navy-300">{meta}</span>
        </span>
      </Link>
    </li>
  );
}
