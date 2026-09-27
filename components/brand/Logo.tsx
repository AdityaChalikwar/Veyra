import Link from "next/link";
import { cn } from "@/lib/cn";

type LogoProps = {
  /** "light" for dark backgrounds (sidebar), "dark" for light backgrounds. */
  tone?: "light" | "dark";
  href?: string;
  className?: string;
};

// Solid fills (no gradient ids) so several logos on one page never clash.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-7 w-7", className)}>
      <path d="M4 6.5c0-1.4 1.6-2.2 2.7-1.4l8.1 6a2 2 0 0 1 .8 1.6V27L5 15.4A4 4 0 0 1 4 12.7z" fill="#7f82f7" />
      <path d="M28 6.5c0-1.4-1.6-2.2-2.7-1.4l-8.1 6a2 2 0 0 0-.8 1.6V27l10.6-11.6a4 4 0 0 0 1-2.7z" fill="#4b48e3" />
    </svg>
  );
}

export function Logo({ tone = "dark", href = "/", className }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)} aria-label="Veyra home">
      <LogoMark />
      <span
        className={cn(
          "text-[19px] font-semibold tracking-tight",
          tone === "light" ? "text-white" : "text-ink",
        )}
      >
        Veyra
      </span>
    </Link>
  );
}
