import type { Verdict } from "@/lib/types";

/** How each verdict reads and looks, everywhere it is shown. */

export const VERDICTS: Verdict[] = ["confirmed", "likely", "unclear", "unlikely", "rejected"];

export const VERDICT_LABEL: Record<Verdict, string> = {
  confirmed: "Confirmed",
  likely: "Likely",
  unclear: "Unclear",
  unlikely: "Unlikely",
  rejected: "Rejected",
};

/** One line on what the verdict means, for people deciding on it. */
export const VERDICT_MEANING: Record<Verdict, string> = {
  confirmed: "The tests support it and the obvious other causes are ruled out.",
  likely: "The tests support it, but something isn't ruled out yet.",
  unclear: "The data can't tell either way.",
  unlikely: "The tests point against it, but it isn't ruled out.",
  rejected: "The evidence is clearly against it.",
};

export const VERDICT_STYLE: Record<Verdict, string> = {
  confirmed: "bg-confirmed-50 text-confirmed-600 border-confirmed-200",
  likely: "bg-confirmed-50/60 text-confirmed-600 border-confirmed-200",
  unclear: "bg-uncertain-50 text-uncertain-600 border-uncertain-200",
  unlikely: "bg-slate-100 text-slate-600 border-line",
  rejected: "bg-slate-200 text-slate-700 border-line",
};

/** Verdicts that support the hypothesis, and that count against it. */
export const SUPPORTED = (v?: string): boolean => v === "confirmed" || v === "likely";
export const AGAINST = (v?: string): boolean => v === "rejected" || v === "unlikely";
