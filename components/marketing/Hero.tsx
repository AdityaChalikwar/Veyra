import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { FlowVisual } from "./FlowVisual";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_70%_0%,rgba(95,95,240,0.08),transparent)]"
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-24">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-brand-600">VEYRA</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Give us the problem.
            <br />
            <span className="text-ink-muted">We&rsquo;ll figure out what to do next.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-muted">
            Veyra does the investigative work of product discovery. It reads your company data and customer
            evidence, separates what&rsquo;s known from what isn&rsquo;t, and helps your team define the real problem
            before deciding what to build.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={routes.signup} size="lg">
              Start an Investigation <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary" size="lg">
              See How It Works
            </ButtonLink>
          </div>
          <p className="mt-6 text-[13px] text-ink-subtle">
            Veyra investigates. You make the decision. Every conclusion traces back to evidence.
          </p>
        </div>
        <FlowVisual className="mx-auto max-w-md lg:ml-auto" />
      </div>
    </section>
  );
}
