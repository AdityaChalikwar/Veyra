import type { InvestigationTopic } from "@/lib/types";

const MAX_TITLE = 60;

/**
 * A short title from the problem as written, e.g.
 * "Our DAU dropped 40%." → "Our DAU dropped 40%".
 */
export function deriveTitle(problem: string): string {
  const text = problem.trim().replace(/\s+/g, " ").replace(/[.!?…]+$/, "");
  const first = text.split(/(?<=[.!?])\s/)[0] ?? text;
  let title = first;
  if (title.length > MAX_TITLE) {
    title = title.slice(0, MAX_TITLE);
    title = title.slice(0, title.lastIndexOf(" ") > 20 ? title.lastIndexOf(" ") : MAX_TITLE).replace(/[,;:\s]+$/, "") + "…";
  }
  return title.charAt(0).toUpperCase() + title.slice(1) || "Untitled investigation";
}

const topicWords: [InvestigationTopic, RegExp][] = [
  ["onboarding", /onboard|activation|activate|sign[- ]?up|setup|first[- ]time/],
  ["retention", /churn|retention|retain|cancel|renewal/],
  ["pricing", /pric|plan|tier|discount|willingness to pay/],
  ["revenue", /revenue|sales|conversion|arpu|mrr|arr|expansion|upsell|deal/],
  ["market", /market|compet|europe|expan(?!sion revenue)|launch|segment/],
  ["adoption", /adopt|feature|usage of|uptake/],
  ["operations", /inventory|operation|fulfil|support|ticket|cost|ops\b/],
  ["engagement", /dau|mau|wau|active users|engagement|usage|session/],
];

/** A best guess at the topic, used for the investigation's icon. */
export function inferTopic(problem: string): InvestigationTopic {
  const p = problem.toLowerCase();
  return topicWords.find(([, re]) => re.test(p))?.[0] ?? "engagement";
}
