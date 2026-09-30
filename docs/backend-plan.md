# Backend plan

The frontend runs on mock data. Every screen gets its data through `lib/data/`, and
`lib/types.ts` defines the shapes. The backend replaces the bodies of these functions;
the screens shouldn't need to change.

This file tracks what each function will need from the real backend. Keep it updated as
the frontend grows.

## Principles the backend must preserve

- **Traceability.** Every finding, hypothesis and recommendation references the evidence
  (and trail steps) it came from. Store these links; don't just generate prose.
- **Kinds stay distinct.** Fact, finding, hypothesis, recommendation and unknown are
  different records with a confidence level, not labels on free text.
- **People approve changes.** Analysing new evidence produces *proposals*. The
  investigation changes only when someone accepts one, and the decision is recorded.
- **Nothing is invented.** If the AI can't answer from the investigation's evidence, it
  says so.

## Functions and what they need

| Function (file) | Real implementation |
|---|---|
| `signInWithGoogle`, `signInWithEmail` (`auth.ts`) | OAuth and email sign-in; session cookie. The client store (`lib/store/app-store.ts`) becomes a cache of the session. |
| `getCurrentUser`, `getCompany`, `saveCompany` (`index.ts`) | Users, organisations and business profile tables. |
| `listInvestigations`, `listActiveInvestigations`, `getInvestigationSummary` (`index.ts`) | Investigations table with status, stage and progress. |
| `listRecentDecisions` (`index.ts`) | Decision log across investigations. |
| `listRecentEvidence` (`index.ts`) | Evidence table joined to investigation titles. |
| `listMemoryHighlights` (`index.ts`) | Business memory entries (learnings, experiments, segments…). |
| `getInvestigationWorkspace` (`index.ts`) | Aggregates an investigation's KPIs, charts, map, questions, evidence, findings, hypotheses, diagnosis, conversation and proposals. Likely several endpoints. |
| `generateClarifyingQuestions` (`investigations.ts`) | AI call using the problem, goal, context and business profile. |
| `createInvestigation` (`investigations.ts`) | Persist the draft and answers; start the first analysis. |
| `analyseEvidence` (`evidence.ts`) | Upload to storage, parse (CSV/Excel/PDF/links), run AI analysis against the investigation, return a summary and proposals. Asynchronous: the UI already shows an "Analysing" state. |
| `reviewProposal` (`evidence.ts`) | Record accept/dismiss and apply accepted changes (link evidence to a finding or hypothesis). |
| `askVeyra` (`assistant.ts`) | AI chat grounded in the investigation's records; replies carry `refs` to the artifacts they discuss. Store the conversation. |

## Still local-only in the preview

- Evidence added, proposals and chat messages live in browser memory and reset on refresh.
- Edited clarifying-question answers inside the workspace aren't saved.
- Only the DAU Decline investigation has full workspace data.
