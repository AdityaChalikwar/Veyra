import { ArrowRight, Hammer } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Temporary in-app placeholder for screens that haven't been built yet.
 * Replaced by the real screen in the milestone it names.
 */
export function PagePlaceholder({
  title,
  description,
  milestone,
  next,
}: {
  title: string;
  description?: string;
  milestone: number;
  next?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-ink-muted">{description}</p>}
      <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-canvas text-ink-subtle">
          <Hammer className="h-5 w-5" />
        </span>
        <p className="mt-4 font-medium">This screen is built in Milestone {milestone}.</p>
        {next && (
          <ButtonLink href={next.href} className="mt-5">
            {next.label} <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
