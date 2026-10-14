import { renderPack, type AnalysisPack } from "./pack";
import type { AnalysisCitation, AnalysisResult } from "./schema";

/**
 * Traceability check, in code. The model cites datasets ("E1") and findings
 * ("F1") by reference; anything citing something that doesn't exist is
 * removed rather than shown, and so is a finding no dataset supports.
 * Observed values must be figures that appear in the evidence pack. The notes
 * say what was removed so a run can be audited.
 */
const MAX_RESEARCH_TASKS = 8;

export function checkCitations(raw: AnalysisResult, pack: AnalysisPack): { result: AnalysisResult; removed: string[] } {
  const removed: string[] = [];
  const refs = new Set(pack.datasets.map((d) => d.ref));
  const packNumbers = new Set(numbersIn(renderPack(pack)));

  // One citation per dataset (the first wins), and only datasets that exist.
  const cleanCitations = (list: AnalysisCitation[], owner: string, allowInsufficient: boolean) => {
    const out = new Map<string, AnalysisCitation>();
    for (const c of list) {
      if (!refs.has(c.ref)) {
        removed.push(`${owner} cited ${c.ref || "a dataset"}, which doesn't exist; that citation was removed.`);
        continue;
      }
      if (!allowInsufficient && c.relation === "insufficient") continue;
      if (!out.has(c.ref)) out.set(c.ref, { ...c, shows: c.shows.trim() });
    }
    return [...out.values()];
  };

  const seen = new Set<string>();
  const findings = raw.findings
    .map((f) => {
      const observed = f.observed && f.observed.values.trim() ? f.observed : { measure: "", values: "", period: "" };
      const unverified = numbersIn(observed.values).filter((n) => !packNumbers.has(n));
      if (unverified.length) removed.push(`Finding ${f.id}: the observed values (${observed.values}) aren't figures from the data, so they were left out.`);
      return {
        ...f,
        observed: unverified.length ? { measure: "", values: "", period: "" } : observed,
        evidence: cleanCitations(f.evidence, `Finding ${f.id}`, false),
      };
    })
    .filter((f) => {
      if (!f.id || seen.has(f.id)) {
        removed.push(`A finding with a repeated or missing id (${f.id || "none"}).`);
        return false;
      }
      if (!f.evidence.some((c) => c.relation === "supports")) {
        removed.push(`Finding ${f.id} wasn't supported by any dataset that exists, so it was removed.`);
        return false;
      }
      seen.add(f.id);
      return true;
    });

  const ids = new Set(findings.map((f) => f.id));
  const known = (list: string[]) => [...new Set(list.filter((id) => ids.has(id)))];

  // Interpretations and insights rest on other findings; observations rest on data.
  const checkedFindings = findings.map((f) => ({ ...f, basedOnFindings: known(f.basedOnFindings).filter((id) => id !== f.id) }));

  // Hypotheses stay even when nothing settles them: they then show as having insufficient evidence.
  const hypSeen = new Set<string>();
  const hypotheses = raw.hypotheses
    .map((h) => ({
      ...h,
      supportingFindings: known(h.supportingFindings),
      contradictingFindings: known(h.contradictingFindings),
      evidence: cleanCitations(h.evidence ?? [], `Hypothesis ${h.id}`, true),
    }))
    .filter((h) => {
      if (!h.id || hypSeen.has(h.id)) {
        removed.push(`A hypothesis with a repeated or missing id (${h.id || "none"}).`);
        return false;
      }
      hypSeen.add(h.id);
      return true;
    });

  // Open questions get unique ids; research tasks may only point at questions and hypotheses that exist.
  const qSeen = new Set<string>();
  const openQuestions = raw.openQuestions
    .filter((q) => q.question.trim())
    .map((q, i) => {
      const id = /^Q\d{1,3}$/.test(q.id) && !qSeen.has(q.id) ? q.id : `Q${i + 1}`;
      qSeen.add(id);
      return { ...q, id };
    });
  const hypIds = new Set(hypotheses.map((h) => h.id));
  const researchTasks = (raw.researchTasks ?? [])
    .filter((t) => t.title.trim() && t.question.trim())
    .slice(0, MAX_RESEARCH_TASKS)
    .map((t) => ({
      ...t,
      answersQuestion: qSeen.has(t.answersQuestion) ? t.answersQuestion : "",
      testsHypotheses: [...new Set(t.testsHypotheses.filter((id) => hypIds.has(id)))],
    }));
  if ((raw.researchTasks?.length ?? 0) > MAX_RESEARCH_TASKS) removed.push(`Only the first ${MAX_RESEARCH_TASKS} research tasks were kept.`);

  const opportunities = raw.opportunities
    .map((o) => ({ ...o, findings: known(o.findings) }))
    .filter((o) => {
      if (o.findings.length === 0) {
        removed.push(`Opportunity “${o.title}” was not tied to any finding.`);
        return false;
      }
      return true;
    });

  return {
    result: {
      ...raw,
      findings: checkedFindings,
      hypotheses,
      openQuestions,
      researchTasks,
      opportunities,
      refinedProblem: { ...raw.refinedProblem, findings: known(raw.refinedProblem.findings) },
    },
    removed,
  };
}

/** The numbers in a piece of text, normalised ("1,234.50" → "1234.5", "07" → "7"). */
export function numbersIn(text: string): string[] {
  return (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => {
    // "07" (as in 2026-09-07) and "7" (as in "7 Sep") are the same number.
    const plain = n.replace(/,/g, "").replace(/^0+(?=\d)/, "");
    return plain.includes(".") ? plain.replace(/\.?0+$/, "") : plain;
  });
}
