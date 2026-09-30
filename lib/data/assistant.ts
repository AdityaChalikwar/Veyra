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
    match: /why do you think|onboard|redesign|release|friction/i,
    reply: {
      text: "The onboarding change is the leading explanation (H1, high confidence, strong evidence): activation fell from 42% to 29% the week after it shipped, onboarding tickets doubled, and existing users weren't affected. It isn't settled — the July shift to paid search (H2) could also lower activation.",
      refs: [
        { kind: "hypothesis", id: "h-onboarding", label: "View H1" },
        { kind: "hypothesis", id: "h-channel", label: "View H2" },
      ],
    },
  },
  {
    match: /don.?t know|unknown|missing|gap|research|next/i,
    reply: {
      text: "Two things matter most right now: whether activation fell in every channel (which would weaken H2), and why new users stall (which only interviews can tell us).",
      list: ["Analyze activation by acquisition channel", "Interview 5–8 recently acquired users"],
      refs: [
        { kind: "research", id: "research", label: "View Research Needed" },
        { kind: "next-step", id: "next-step", label: "View next step" },
      ],
    },
  },
  {
    match: /problem|who|affected|segment|new users|existing/i,
    reply: {
      text: "The evidence suggests the original problem (“DAU dropped 40%”) is too broad. Existing users are behaving as before; the decline comes from newly acquired users who don't reach activation.",
      refs: [{ kind: "problem", id: "problem", label: "View refined problem" }],
    },
  },
  {
    match: /channel|paid|search|acquisition|mix/i,
    reply: {
      text: "Paid search grew from 31% to 49% of new signups in July. That's H2 — moderate evidence, medium confidence. We haven't yet checked whether activation fell only in paid search.",
      refs: [{ kind: "hypothesis", id: "h-channel", label: "View H2" }],
    },
  },
  {
    match: /competit|market/i,
    reply: {
      text: "Nothing in your internal data points to competitors — existing users are staying. It's H3 (low confidence, weak evidence). A public competitor scan would help rule it out, but it's secondary.",
      refs: [{ kind: "hypothesis", id: "h-competitor", label: "View H3" }],
    },
  },
  {
    match: /build|solution|fix|what should we do|opportunit/i,
    reply: {
      text: "It's too early to pick a solution. Veyra recommends validating the onboarding hypothesis first; the opportunity areas are provisional until then.",
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
  "Why do you think onboarding is the cause?",
  "What don't we know yet?",
  "Who is actually affected?",
];
