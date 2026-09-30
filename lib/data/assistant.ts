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
    match: /onboard|redesign|release/i,
    reply: {
      text: "Possibly. The current evidence supports this as a medium-high confidence hypothesis. Onboarding completion fell from 71% to 53% after the April redesign, and the decline is concentrated in new paid-social users. It isn't confirmed yet — we still need to compare cohorts from before and after the release.",
      refs: [{ kind: "hypothesis", id: "h-onboarding", label: "View Hypothesis" }],
    },
  },
  {
    match: /missing|gap|unknown|don.?t know|need/i,
    reply: {
      text: "The biggest gap is a cohort comparison. Without it, we can't separate the effect of the onboarding redesign from a change in who paid social is bringing in.",
      list: [
        "Activation and 30-day retention by signup week",
        "The same, split by acquisition source",
        "Paid-social targeting or creative changes since March",
      ],
      refs: [{ kind: "diagnosis", id: "diagnosis", label: "View Diagnosis" }],
    },
  },
  {
    match: /segment|paid|social|channel|who|organic|users|affected/i,
    reply: {
      text: "Paid-social users account for about 90% of the drop: they fell from 70K to 27K daily actives (−61%), while organic fell 11%. That's a high-confidence finding.",
      refs: [{ kind: "finding", id: "f-paid-social", label: "View Finding" }],
    },
  },
  {
    match: /competit/i,
    reply: {
      text: "It's possible but currently the weakest explanation. A competitor launched in May, but our paid-social installs haven't fallen — users are still arriving, they're just not sticking.",
      refs: [{ kind: "hypothesis", id: "h-competition", label: "View Hypothesis" }],
    },
  },
  {
    match: /what (should|do) we do|recommend|next|fix/i,
    reply: {
      text: "Before deciding, I'd close the cohort-analysis gap — it's cheap and it's the one result that could change the recommendation. If it confirms the onboarding effect, fixing onboarding for paid-social users comes before any increase in acquisition spend.",
      refs: [{ kind: "diagnosis", id: "diagnosis", label: "View Diagnosis" }],
    },
  },
];

const fallback: Reply = {
  text: "I can't answer that from the evidence in this investigation yet. I can help with the onboarding redesign, which users are affected, competition, or what evidence is still missing.",
};

export async function askVeyra(investigationId: string, question: string): Promise<ChatMessage> {
  void investigationId;
  await delay(900);
  const reply = replies.find((r) => r.match.test(question))?.reply ?? fallback;
  return { id: `a-${Date.now()}`, role: "assistant", createdAt: new Date().toISOString(), ...reply };
}

export const suggestedPrompts = [
  "Could the onboarding redesign be responsible?",
  "What evidence is missing?",
  "Which users are most affected?",
];
