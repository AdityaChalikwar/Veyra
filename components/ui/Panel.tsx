import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** A titled card section with an optional "view all" link. */
export function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col rounded-xl border border-line bg-surface shadow-card", className)}>
      <header className="flex items-center justify-between gap-3 px-5 pb-1 pt-4">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
          >
            {action.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </header>
      <div className="flex-1 px-5 pb-4">{children}</div>
    </section>
  );
}
