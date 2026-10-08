import type { AnalysisPack } from "./pack";
import type { AnalysisResult } from "./schema";

/**
 * Traceability check, in code. The model cites datasets ("E1") and findings
 * ("F1") by reference; anything citing something that doesn't exist, or
 * citing nothing, is removed rather than shown. The notes say what was removed
 * so a run can be audited.
 */
export function checkCitations(raw: AnalysisResult, pack: AnalysisPack): { result: AnalysisResult; removed: string[] } {
  const removed: string[] = [];
  const refs = new Set(pack.datasets.map((d) => d.ref));

  const seen = new Set<string>();
  const findings = raw.findings
    .map((f) => ({ ...f, evidence: [...new Set(f.evidence.filter((r) => refs.has(r)))] }))
    .filter((f) => {
      if (!f.id || seen.has(f.id)) {
        removed.push(`A finding with a repeated or missing id (${f.id || "none"}).`);
        return false;
      }
      if (f.evidence.length === 0) {
        removed.push(`Finding ${f.id} cited no dataset that exists.`);
        return false;
      }
      seen.add(f.id);
      return true;
    });

  const ids = new Set(findings.map((f) => f.id));
  const known = (list: string[]) => [...new Set(list.filter((id) => ids.has(id)))];

  // Interpretations and insights rest on other findings; observations rest on data.
  const checkedFindings = findings.map((f) => ({ ...f, basedOnFindings: known(f.basedOnFindings).filter((id) => id !== f.id) }));

  const hypSeen = new Set<string>();
  const hypotheses = raw.hypotheses
    .map((h) => ({ ...h, supportingFindings: known(h.supportingFindings), contradictingFindings: known(h.contradictingFindings) }))
    .filter((h) => {
      if (!h.id || hypSeen.has(h.id)) {
        removed.push(`A hypothesis with a repeated or missing id (${h.id || "none"}).`);
        return false;
      }
      if (h.supportingFindings.length + h.contradictingFindings.length === 0) {
        removed.push(`Hypothesis ${h.id} was not tied to any finding.`);
        return false;
      }
      hypSeen.add(h.id);
      return true;
    });

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
      opportunities,
      refinedProblem: { ...raw.refinedProblem, findings: known(raw.refinedProblem.findings) },
    },
    removed,
  };
}
