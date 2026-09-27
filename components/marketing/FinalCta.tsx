import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export function FinalCta() {
  return (
    <section className="bg-canvas py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-navy-900 px-6 py-10 sm:px-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Bring us the problem you keep circling back to.
            </h2>
            <p className="mt-2 text-navy-200">Your first investigation takes about ten minutes to set up.</p>
          </div>
          <ButtonLink href={routes.signup} variant="inverse" size="lg">
            Start Investigating <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
