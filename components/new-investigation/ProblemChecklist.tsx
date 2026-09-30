import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Light-touch guidance while typing. These are tips, not validation —
 * Veyra can work with any problem statement.
 */
const checks = [
  {
    label: "Names what changed",
    example: "sales, DAU, churn, conversion…",
    test: /\b(sales|revenue|dau|mau|users?|customers?|churn|conversion|retention|sign-?ups?|orders?|traffic|margin|costs?|engagement|nps|activation|pipeline|arpu|ltv|cac|leads?|bookings?|market)\b/i,
  },
  { label: "Says how big the change is", example: "25%, 3.2 points, 40K", test: /\d/ },
  {
    label: "Gives a time period",
    example: "since April, over six months",
    test: /\b(days?|weeks?|months?|quarters?|years?|since|q[1-4]|20\d\d|january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  },
];

export function ProblemChecklist({ problem }: { problem: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <p className="text-sm font-semibold">Strong problem statements usually…</p>
      <ul className="mt-3 space-y-2.5">
        {checks.map((c) => {
          const met = c.test.test(problem);
          return (
            <li key={c.label} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                  met ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong",
                )}
                aria-hidden="true"
              >
                {met && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
              </span>
              <span>
                <span className={cn("block text-[13px]", met ? "text-ink" : "text-ink-muted")}>{c.label}</span>
                <span className="block text-xs text-ink-faint">e.g. {c.example}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
