import { Check, FileText } from "lucide-react";
import { KindBadge } from "@/components/ui/KindBadge";
import type { ArtifactKind } from "@/lib/types";

const principles = [
  "Separates facts from hypotheses — and says so",
  "Shows the evidence behind every conclusion",
  "Is explicit about what it doesn't know yet",
  "Remembers what your business has learned",
];

const artifacts: { kind: ArtifactKind; text: string; meta: string }[] = [
  { kind: "fact", text: "DAU fell from 120K to 72K between April and August.", meta: "dau_data.csv" },
  { kind: "finding", text: "The decline is concentrated among paid-social users (−61%).", meta: "High confidence" },
  { kind: "hypothesis", text: "The April onboarding redesign reduced activation.", meta: "Medium-high confidence" },
  { kind: "unknown", text: "Did acquisition quality change independently?", meta: "Needs cohort analysis" },
  { kind: "recommendation", text: "Fix onboarding for paid social before scaling spend.", meta: "Impact high · Effort medium" },
];

export function NotAChatbot() {
  return (
    <section id="why-veyra" className="scroll-mt-16 border-y border-line bg-white py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-[13px] font-semibold text-brand-600">Why Veyra</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Not another AI chatbot.</h2>
          <p className="mt-4 leading-relaxed text-ink-muted">
            A chatbot gives you an answer and a long scroll-back. Veyra builds an investigation: questions,
            evidence, findings, hypotheses and decisions as structured artifacts you can review, challenge and
            share. You can understand the whole investigation without reading a single chat message.
          </p>
          <ul className="mt-6 space-y-2.5">
            {principles.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-confirmed-600" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-line-strong bg-canvas p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">A typical AI chat</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-subtle">
              &ldquo;Your DAU may have declined due to seasonality, competition or product issues. Consider
              improving onboarding and investing in marketing.&rdquo;
            </p>
            <p className="mt-2 text-xs text-ink-faint">Plausible. Untraceable. Confidently vague.</p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 shadow-raised">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">A Veyra investigation</p>
              <FileText className="h-4 w-4 text-ink-faint" />
            </div>
            <ul className="mt-3 divide-y divide-line">
              {artifacts.map((a) => (
                <li key={a.text} className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-start sm:gap-3">
                  <KindBadge kind={a.kind} className="w-fit shrink-0 sm:mt-0.5 sm:w-[136px] sm:justify-center" />
                  <div className="min-w-0">
                    <p className="text-[13.5px] text-ink">{a.text}</p>
                    <p className="text-xs text-ink-subtle">{a.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
