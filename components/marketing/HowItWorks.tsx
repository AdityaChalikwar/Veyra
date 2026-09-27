import { BarChart3, FileSearch, MessageSquareText, Scale, Upload } from "lucide-react";

const steps = [
  {
    icon: MessageSquareText,
    title: "Tell us the problem",
    body: "Describe what's going wrong in plain language. Veyra asks the clarifying questions a good analyst would.",
    output: "Problem & goal",
  },
  {
    icon: Upload,
    title: "Give us the evidence",
    body: "Connect company data, analytics and research. Add notes, links and customer feedback.",
    output: "Evidence library",
  },
  {
    icon: FileSearch,
    title: "Investigate the causes",
    body: "Veyra breaks the problem down, tests possible causes and separates facts from hypotheses.",
    output: "Findings & diagnosis",
  },
  {
    icon: Scale,
    title: "Decide what to do",
    body: "Weigh options by impact, effort, risk and confidence — with the evidence for each in view.",
    output: "Recommendation",
  },
  {
    icon: BarChart3,
    title: "Measure what happened",
    body: "Turn the decision into an action plan and experiment. Results feed your business memory.",
    output: "Learnings",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-canvas py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold text-brand-600">How Veyra works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">From a vague problem to a measured decision.</h2>
          <p className="mt-3 text-ink-muted">
            Five steps, each producing something you can review, share and come back to.
          </p>
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
