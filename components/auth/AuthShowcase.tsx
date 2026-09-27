import { FileSearch, GitBranch, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { KindBadge } from "@/components/ui/KindBadge";

const points = [
  { icon: FileSearch, text: "Structured investigations, not chat transcripts" },
  { icon: ShieldCheck, text: "Every conclusion traced back to evidence" },
  { icon: GitBranch, text: "Facts, hypotheses and unknowns kept separate" },
];

/** Left-hand brand panel on the auth screen (desktop only). */
export function AuthShowcase() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-10 text-white lg:flex">
      <Logo tone="light" />

      <div className="max-w-md">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">
          Give us the problem.
          <br />
          <span className="text-navy-300">We&rsquo;ll figure out what to do next.</span>
        </h2>
        <ul className="mt-8 space-y-3.5">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[15px] text-navy-200">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-800 text-brand-300">
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-xl border border-navy-700 bg-navy-800/70 p-4">
          <div className="flex items-center gap-2">
            <KindBadge kind="finding" />
            <span className="text-xs text-navy-300">High confidence · user_segments.csv</span>
          </div>
          <p className="mt-2 text-sm text-white">The DAU decline is concentrated among paid-social users (−61%).</p>
        </div>
      </div>

      <p className="text-xs text-navy-300">© 2026 Veyra</p>
    </aside>
  );
}
