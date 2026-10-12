/**
 * Research that Veyra runs on request — simulated. In the real product these
 * query connected systems (analytics, CRM, support) or public sources. Results
 * arrive as new evidence and observations; links to hypotheses are suggestions
 * a person accepts or dismisses.
 */
import type { EvidenceItem, EvidenceProposal, FeedbackTheme, Finding } from "@/lib/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ResearchResult = {
  result: string;
  evidence?: EvidenceItem;
  finding?: Finding;
  proposals: EvidenceProposal[];
  /** Open questions this research answers. */
  answers: string[];
};

const inv = "kitchen-returns";
const now = () => new Date().toISOString();

export async function runResearchTask(taskId: string): Promise<ResearchResult> {
  await delay(2200);

  if (taskId === "r-products") {
    const evidence: EvidenceItem = {
      id: "ev-returns-by-product",
      investigationId: inv,
      name: "Defect returns by Kitchen product",
      category: "company-data",
      source: "ERP",
      dataset: "Returns joined to products",
      coverage: "Jul – Sep 2026",
      format: "dataset",
      addedAt: now(),
      description: "Kitchen units returned as defective or damaged since July, by product.",
      preview: {
        columns: ["product", "defect_returns", "units_sold", "rate"],
        rows: [["Stoneware Dinner Plate Set", 19, 104, "18%"], ["Ceramic Pasta Bowls", 15, 98, "15%"], ["Ceramic Mixing Bowls", 12, 91, "13%"], ["Glazed Mug Set", 11, 102, "11%"]],
      },
    };
    return {
      result: "Four stoneware and ceramic products account for 70% of Kitchen defect returns since July: the dinner plate set, pasta bowls, mixing bowls and mug set.",
      evidence,
      finding: {
        id: "f-products",
        investigationId: inv,
        kind: "observation",
        statement: "Four ceramic products account for 70% of Kitchen defect returns since July.",
        confidence: "high",
        confidenceReason: "Every return is linked to its product in the ERP.",
        evidenceIds: [evidence.id],
        detail: {
          metricLabel: "Share of Kitchen defect returns, Jul – Sep",
          before: { label: "4 ceramic products", value: "70%" },
          after: { label: "8 other Kitchen products", value: "30%" },
          change: "Concentrated",
          supporting: ["All four are glazed ceramics, made by Quanta since June."],
          contradicting: [],
          unknowns: [],
        },
        trail: [
          { text: "Joined defective and damaged Kitchen returns to the product list.", evidenceId: evidence.id },
          { text: "Ranked products by defect returns since 1 July." },
          { text: "The top four — all glazed ceramics — make up 57 of 82 units (70%)." },
        ],
      },
      proposals: [
        { id: "p-products-h1", investigationId: inv, evidenceId: evidence.id, action: "supports-hypothesis", targetId: "h-quality", summary: "Add as supporting evidence for H1 — defects cluster in Quanta's glazed ceramics.", status: "pending" },
      ],
      answers: ["oq-which"],
    };
  }

  if (taskId === "r-compare") {
    const evidence: EvidenceItem = {
      id: "ev-batches",
      investigationId: inv,
      name: "Defect returns by supplier batch",
      category: "company-data",
      source: "ERP",
      dataset: "Returns joined to goods receipts",
      coverage: "Jan – Sep 2026",
      format: "dataset",
      addedAt: now(),
      preview: { columns: ["supplier", "units_sold", "defect_returns", "per_100"], rows: [["Hartwell Ceramics", 2104, 29, "1.4"], ["Quanta Homewares", 1043, 93, "8.9"]] },
    };
    return {
      result: "Items from Quanta's batches are returned as defective or damaged at 8.9 per 100 sold, against 1.4 for Hartwell's.",
      evidence,
      finding: {
        id: "f-batches",
        investigationId: inv,
        kind: "observation",
        statement: "Items from Quanta's batches are returned as defective or damaged six times as often as Hartwell's.",
        confidence: "high",
        confidenceReason: "Each sold unit is traced to the goods receipt it came from.",
        evidenceIds: [evidence.id],
        trail: [
          { text: "Traced every Kitchen unit sold to its supplier batch.", evidenceId: evidence.id },
          { text: "Hartwell: 1.4 defect returns per 100 units. Quanta: 8.9." },
          { text: "The gap holds for every month since Quanta stock went on sale." },
        ],
      },
      proposals: [
        { id: "p-batches-h1", investigationId: inv, evidenceId: evidence.id, action: "supports-hypothesis", targetId: "h-quality", summary: "Add as supporting evidence for H1 — defects are six times higher in Quanta's batches.", status: "pending" },
        { id: "p-batches-h3", investigationId: inv, evidenceId: evidence.id, action: "contradicts-hypothesis", targetId: "h-season", summary: "Mark as contradicting evidence for H3 — the gap is by supplier, not by season.", status: "pending" },
      ],
      answers: ["oq-supplier"],
    };
  }

  // r-competitors → public research, clearly labelled
  const evidence: EvidenceItem = {
    id: "ev-competitors-public",
    investigationId: inv,
    name: "Competitor kitchenware review scan",
    category: "public-research",
    source: "Public web",
    coverage: "Jul – Sep 2026",
    format: "link",
    addedAt: now(),
    description: "Reviews of budget stoneware at three competitors. Chipping complaints appear, but no sharp rise this summer.",
    qualityNote: "Public sources only; may be incomplete.",
  };
  return {
    result: "No sign of a market-wide quality problem with budget ceramics this summer. Context, not a cause.",
    evidence,
    proposals: [],
    answers: [],
  };
}

export type FeedbackResult = { themes: FeedbackTheme[]; finding: Finding; proposals: EvidenceProposal[] };

/** Groups return notes and product reviews into themes. */
export async function analyseExistingFeedback(): Promise<FeedbackResult> {
  await delay(2400);
  return {
    themes: [
      { theme: "Chipped or cracked on arrival", mentions: 96, example: "“Two of the six plates were chipped when I opened the box.”" },
      { theme: "Glaze flaking or crazing after a few washes", mentions: 54, example: "“The mugs started crazing after a week in the dishwasher.”" },
      { theme: "Arrived later than promised", mentions: 21, example: "“Took almost two weeks to arrive.”" },
      { theme: "Colour differs from the photos", mentions: 17, example: "“Much greyer than on the website.”" },
    ],
    finding: {
      id: "f-feedback-insight",
      investigationId: inv,
      kind: "insight",
      statement: "Most Kitchen complaints since July describe items chipped, cracked or flaking — a quality problem, not a delivery one.",
      confidence: "medium-high",
      confidenceReason: "Consistent across return notes and reviews; not yet confirmed in conversations with customers.",
      evidenceIds: ["ev-support", "ev-feedback"],
      basedOnFindingIds: ["f-reasons"],
      trail: [
        { text: "Grouped 214 return notes and 412 product reviews into themes.", evidenceId: "ev-support" },
        { text: "The two largest themes (150 mentions) describe faults in the item itself.", evidenceId: "ev-feedback" },
        { text: "This matches the 2025 learning in Business Memory about cheaper suppliers." },
      ],
    },
    proposals: [
      { id: "p-feedback-h1", investigationId: inv, evidenceId: "ev-feedback", action: "supports-hypothesis", targetId: "h-quality", summary: "Add product reviews as supporting evidence for H1 — complaints centre on faults in the items.", status: "pending" },
    ],
  };
}

export type InterviewGuide = { goal: string; recruit: string[]; questions: { section: string; items: string[] }[]; avoid: string[] };

/** A draft interview guide for customers who returned Kitchen items. */
export function getInterviewGuide(): InterviewGuide {
  return {
    goal: "Understand what was wrong with the Kitchen items customers returned since July, and whether it changed how they see Northwind.",
    recruit: [
      "6–8 customers who returned a Kitchen item since July",
      "At least 2 who returned more than one item",
      "At least 1 trade customer",
    ],
    questions: [
      {
        section: "Context",
        items: ["What did you buy, and what was it for?", "Had you bought kitchenware from Northwind before?"],
      },
      {
        section: "The item",
        items: [
          "Walk me through opening the box. What did you see?",
          "What exactly was wrong with it?",
          "Was the packaging damaged too?",
        ],
      },
      {
        section: "Afterwards",
        items: ["How did the return go?", "Would you buy kitchenware from Northwind again? Why or why not?"],
      },
      { section: "Wrap-up", items: ["If you could change one thing about the product or how it arrived, what would it be?"] },
    ],
    avoid: ["Don't mention the supplier change.", "Ask about what happened, not what they'd like."],
  };
}
