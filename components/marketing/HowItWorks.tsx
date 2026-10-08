import { BarChart3, FileSearch, MessageSquareText, Scale, Upload } from "lucide-react";

const steps = [
  {
    icon: MessageSquareText,
    title: "Bring a problem",
    body: "A metric moved, customers are complaining, or there's a market to evaluate. Veyra asks what it needs to know.",
    output: "Investigation plan",
  },
  {
    icon: Upload,
    title: "Investigate the evidence",
    body: "Veyra analyses product analytics, CRM, ERP, support and research — choosing methods that fit the problem.",
    output: "Observations & hypotheses",
  },
  {
    icon: FileSearch,
    title: "Define the real problem",
    body: "Separate what's known from what isn't, and refine a vague symptom into a problem worth solving.",
    output: "Problem definition",
  },
  {
    icon: Scale,
    title: "Find the next step",
    body: "Explore opportunities, then decide the next discovery step — often research or validation, not a feature.",
    output: "Recommended next step",
  },
  {
    icon: BarChart3,
    title: "Validate and learn",
    body: "Test the riskiest assumptions. What you learn is kept in business memory for the next investigation.",
    output: "Validated learning",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-canvas py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold text-brand-600">How Veyra works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">From a vague symptom to the right problem.</h2>
          <p className="mt-3 text-ink-muted">
            The investigation adapts to the problem — and each step produces something your team can review and challenge.
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex flex-col rounded-xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-ink-faint">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-semibold">{step.title}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-muted">{step.body}</p>
                <p className="mt-4 border-t border-line pt-3 text-xs text-ink-subtle">
                  Produces <span className="font-medium text-ink">{step.output}</span>
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
