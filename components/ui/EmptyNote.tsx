import { cn } from "@/lib/cn";

/** What a list shows before there's anything in it. */
export function EmptyNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("rounded-xl border border-dashed border-line-strong px-4 py-5 text-center text-[13px] text-ink-subtle", className)}>
      {children}
    </p>
  );
}
