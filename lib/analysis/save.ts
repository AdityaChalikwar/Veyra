import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { AnalysisPack } from "./pack";
import type { AnalysisResult } from "./schema";
import { structureRun } from "./structure";

/**
 * Saves a finished run as evidence-engine rows: its findings, its hypotheses,
 * and a link from each to every evidence item it cites. The run's JSON stays
 * as the record of what the model returned; these rows are what the screens
 * read and what later milestones build on. Runs as the signed-in user, so the
 * database's rules decide what may be linked to what.
 */
export async function saveEvidenceRows(
  supabase: SupabaseClient<Database>,
  investigationId: string,
  runId: string,
  result: AnalysisResult,
  pack: AnalysisPack,
): Promise<{ ok: true } | { error: string }> {
  const refs = new Map(pack.datasets.map((d) => [d.ref, d.evidenceId]));
  const { findings, hypotheses } = structureRun(result, (ref) => refs.get(ref));

  const { data: fRows, error: fError } = findings.length
    ? await supabase
        .from("findings")
        .insert(
          findings.map((f, i) => ({
            investigation_id: investigationId,
            analysis_run_id: runId,
            ref: f.ref,
            position: i,
            kind: f.kind,
            statement: f.statement.slice(0, 2000),
            observed: (f.observed ?? null) as Json | null,
            confidence: f.confidence,
            confidence_reason: f.confidenceReason,
            based_on: f.basedOn,
          })),
        )
        .select("id, ref")
    : { data: [], error: null };
  if (fError) return { error: fError.message };

  const { data: hRows, error: hError } = hypotheses.length
    ? await supabase
        .from("hypotheses")
        .insert(
          hypotheses.map((h, i) => ({
            investigation_id: investigationId,
            analysis_run_id: runId,
            ref: h.ref,
            position: i,
            statement: h.statement.slice(0, 2000),
            rationale: h.rationale,
            confidence: h.confidence,
            evidence_strength: h.evidenceStrength,
            evidence_status: h.evidenceStatus,
            supporting_findings: h.supportingFindings,
            contradicting_findings: h.contradictingFindings,
            validation_method: h.validationMethod,
          })),
        )
        .select("id, ref")
    : { data: [], error: null };
  if (hError) {
    await supabase.from("findings").delete().eq("analysis_run_id", runId);
    return { error: hError.message };
  }

  const findingId = new Map((fRows ?? []).map((r) => [r.ref, r.id]));
  const hypothesisId = new Map((hRows ?? []).map((r) => [r.ref, r.id]));
  const links = [
    ...findings.flatMap((f) =>
      f.links.map((l) => ({ investigation_id: investigationId, evidence_id: l.evidenceId, finding_id: findingId.get(f.ref)!, relation: l.relation, shows: l.shows.slice(0, 1000) })),
    ),
    ...hypotheses.flatMap((h) =>
      h.links.map((l) => ({ investigation_id: investigationId, evidence_id: l.evidenceId, hypothesis_id: hypothesisId.get(h.ref)!, relation: l.relation, shows: l.shows.slice(0, 1000) })),
    ),
  ];
  if (links.length) {
    const { error } = await supabase.from("evidence_links").insert(links);
    if (error) {
      // All or nothing: without its links a finding isn't traceable, so the screens fall back to the run's JSON.
      await supabase.from("findings").delete().eq("analysis_run_id", runId);
      await supabase.from("hypotheses").delete().eq("analysis_run_id", runId);
      return { error: error.message };
    }
  }
  return { ok: true };
}
