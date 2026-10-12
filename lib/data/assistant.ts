/**
 * Veyra AI — simulated. Answers come from a few canned responses matched on
 * keywords, and always point back to investigation artifacts. Replace with the
 * real AI service later; the UI only depends on `askVeyra` returning a ChatMessage.
 */
import type { ChatMessage } from "@/lib/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Reply = Pick<ChatMessage, "text" | "list" | "refs">;

const replies: { match: RegExp; reply: Reply }[] = [
  {
    match: /why do you think|supplier|quanta|quality|defect|cause/i,
    reply: {
      text: "The new supplier is the leading explanation (H1, high confidence, strong evidence): Kitchen's return rate went from 3.6% to 10.1% after Quanta's goods went on sale, almost entirely as defective or damaged items, while other categories stayed steady. It isn't settled — longer delivery times (H2) could add transit damage.",
      refs: [
        { kind: "hypothesis", id: "h-quality", label: "View H1" },
        { kind: "hypothesis", id: "h-delivery", label: "View H2" },
      ],
    },
  },
  {
    match: /don.?t know|unknown|missing|gap|research|next/i,
    reply: {
      text: "Two things matter most right now: which Kitchen products drive the defects, and whether the faults come from manufacturing or from transit.",
      list: ["Analyze defect returns by Kitchen product", "Talk to 6–8 customers who returned a Kitchen item"],
      refs: [
        { kind: "research", id: "research", label: "View Research Needed" },
        { kind: "next-step", id: "next-step", label: "View next step" },
      ],
    },
  },
  {
    match: /problem|who|affected|segment|customer/i,
    reply: {
      text: "The evidence suggests this isn't a returns problem in general. Only Kitchen customers are affected — those buying since the first Quanta stock went on sale in late June.",
      refs: [{ kind: "problem", id: "problem", label: "View refined problem" }],
    },
  },
  {
    match: /deliver|late|lead time|transit|damage/i,
    reply: {
      text: "Quanta takes 27 days to deliver instead of 11. That's H2 — moderate evidence, medium confidence. But “late” returns actually fell, so lateness isn't what customers are returning items for.",
      refs: [{ kind: "hypothesis", id: "h-delivery", label: "View H2" }],
    },
  },
  {
    match: /season|summer|competit|market/i,
    reply: {
      text: "Nothing points to a seasonal rise — other categories' return rates didn't move. That's H3 (low confidence, weak evidence).",
      refs: [{ kind: "hypothesis", id: "h-season", label: "View H3" }],
    },
  },
  {
    match: /build|solution|fix|what should we do|opportunit|switch back/i,
    reply: {
      text: "It's too early to pick a fix. Veyra recommends confirming which products and whether it's manufacturing or transit first; the opportunity areas are provisional until then.",
      refs: [
        { kind: "next-step", id: "next-step", label: "View next step" },
        { kind: "opportunities", id: "opportunities", label: "View opportunities" },
      ],
    },
  },
];

const fallback: Reply = {
  text: "I can't answer that from the evidence in this investigation yet. I can explain the findings, the hypotheses, what we don't know, or the recommended next step.",
};

export async function askVeyra(investigationId: string, question: string): Promise<ChatMessage> {
  void investigationId;
  await delay(900);
  const reply = replies.find((r) => r.match.test(question))?.reply ?? fallback;
  return { id: `a-${Date.now()}`, role: "assistant", createdAt: new Date().toISOString(), ...reply };
}

export const suggestedPrompts = [
  "Why do you think the supplier is the cause?",
  "What don't we know yet?",
  "Who is actually affected?",
];
