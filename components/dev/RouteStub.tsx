import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Temporary placeholder so the full journey is navigable while screens are built.
 * Each stub is replaced by its real screen in the milestone it names.
 */
export function RouteStub({
  title,
  milestone,
  next,
}: {
  title: string;
  milestone?: number;
  next?: { href: string; label: string };
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <Logo className="justify-center" />
        <h1 className="mt-6 text-xl font-semibold">{title}</h1>
        {milestone && <p className="mt-2 text-sm text-ink-subtle">This screen is built in Milestone {milestone}.</p>}
        <div className="mt-6 flex flex-col gap-2">
          {next && (
            <ButtonLink href={next.href}>
              {next.label} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          )}
          <ButtonLink href="/" variant="ghost" size="sm">
            Back to landing page
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
