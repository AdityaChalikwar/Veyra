import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { OpportunityResult, ProblemResult } from "./discovery";
import type { AnalysisPack } from "./pack";

/**
 * Saves a problem definition or a set of opportunities as rows, with a link
 * to each dataset they cite. Runs as the signed-in user, so the database's
 * rules decide what may be linked; all or nothing.
 */

type Client = SupabaseClient<Database>;
const refsOf = (pack: AnalysisPack) => new Map(pack.datasets.map((d) => [d.ref, d.evidenceId]));

export async function saveProblem(
  supabase: Client,
  investigationId: string,
  runId: string,
  p: ProblemResult,
  pack: AnalysisPack,
): Promise<{ ok: true; id: string } | { error: string }> {
  const { data: row, error } = await supabase
    .from("problem_definitions")
    .insert({
      investigation_id: investigationId,
      analysis_run_id: runId,
      statement: p.statement.slice(0, 1000),
      affected: p.affected.slice(0, 1000),
      need: p.need.slice(0, 1000),
      obstacle: p.obstacle.slice(0, 1000),
      business_impact: p.businessImpact.slice(0, 1000),
      confidence: p.confidence,
      confidence_reason: p.confidenceReason,
      assumptions: p.assumptions,
      finding_refs: p.findings,
      hypothesis_refs: p.hypotheses,
    })
    .select("id")
    .single();
  if (error || !row) return { error: error?.message ?? "not saved" };
  const refs = refsOf(pack);
  const links = p.evidence.flatMap((e) => {
    const evidenceId = refs.get(e.ref);
    return evidenceId ? [{ investigation_id: investigationId, evidence_id: evidenceId, problem_definition_id: row.id, relation: e.relation, shows: e.shows.slice(0, 1000) }] : [];
  });
  if (links.length) {
    const { error: linkError } = await supabase.from("evidence_links").insert(links);
    if (linkError) {
      await supabase.from("problem_definitions").delete().eq("id", row.id);
      return { error: linkError.message };
    }
  }
  return { ok: true, id: row.id };
}

export async function saveOpportunities(
  supabase: Client,
  investigationId: string,
  problemId: string,
  list: OpportunityResult[],
  pack: AnalysisPack,
): Promise<{ ok: true } | { error: string }> {
  // A new set replaces the previous one for this problem definition.
  await supabase.from("opportunities").delete().eq("problem_definition_id", problemId);
  const { data: rows, error } = await supabase
    .from("opportunities")
    .insert(
      list.map((o, i) => ({
        investigation_id: investigationId,
        problem_definition_id: problemId,
        position: i,
        title: o.title.slice(0, 200),
        customer_problem: o.customerProblem.slice(0, 1000),
        potential_impact: o.potentialImpact.slice(0, 1000),
        impact_level: o.impactLevel,
        confidence: o.confidence,
        assumptions: o.assumptions,
        validation_needs: o.validationNeeds,
        finding_refs: o.findings,
      })),
    )
    .select("id, position");
  if (error || !rows) return { error: error?.message ?? "not saved" };
  const refs = refsOf(pack);
  const links = rows.flatMap((r) =>
    list[r.position].evidence.flatMap((e) => {
      const evidenceId = refs.get(e.ref);
      return evidenceId ? [{ investigation_id: investigationId, evidence_id: evidenceId, opportunity_id: r.id, relation: e.relation, shows: e.shows.slice(0, 1000) }] : [];
    }),
  );
  if (links.length) {
    const { error: linkError } = await supabase.from("evidence_links").insert(links);
    if (linkError) {
      await supabase.from("opportunities").delete().eq("problem_definition_id", problemId);
      return { error: linkError.message };
    }
  }
  return { ok: true };
}
