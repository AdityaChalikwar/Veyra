import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { AnalysisPack } from "./pack";
import type { AnalysisResult } from "./schema";
import { structureRun } from "./structure";

/**
 * Saves a finished run as rows: findings and hypotheses with a link to every
 * evidence item they cite, open questions, the next step (with the approach
 * the engine chose), and new research tasks. The run's JSON stays as the
 * record of what the model returned; these rows are what the screens read.
 * Runs as the signed-in user, so the database's rules decide what may be
 * linked to what. All or nothing: on any failure the run's rows are removed
 * and the screens read the run's JSON instead.
 */
export async function saveEvidenceRows(
  supabase: SupabaseClient<Database>,
  investigationId: string,
  runId: string,
  result: AnalysisResult,
  pack: AnalysisPack,
): Promise<{ ok: true } | { error: string }> {
  const refs = new Map(pack.datasets.map((d) => [d.ref, d.evidenceId]));
  const { findings, hypotheses, openQuestions, researchTasks, nextStep } = structureRun(result, (ref) => refs.get(ref));

  const undo = async (message: string) => {
    await Promise.all([
      supabase.from("findings").delete().eq("analysis_run_id", runId),
      supabase.from("hypotheses").delete().eq("analysis_run_id", runId),
      supabase.from("open_questions").delete().eq("analysis_run_id", runId),
      supabase.from("next_steps").delete().eq("analysis_run_id", runId),
      supabase.from("research_tasks").delete().eq("analysis_run_id", runId),
    ]);
    return { error: message };
  };

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
            title: f.title.slice(0, 200),
            statement: f.statement.slice(0, 2000),
            observed: (f.observed ?? null) as Json | null,
            confidence: f.confidence,
            confidence_reason: f.confidenceReason,
            based_on: f.basedOn,
          })),
        )
        .select("id, ref")
    : { data: [], error: null };
  if (fError) return undo(fError.message);

  const { data: hRows, error: hError } = hypotheses.length
    ? await supabase
        .from("hypotheses")
        .insert(
          hypotheses.map((h, i) => ({
            investigation_id: investigationId,
            analysis_run_id: runId,
            ref: h.ref,
            position: i,
            title: h.title.slice(0, 200),
            statement: h.statement.slice(0, 2000),
            rationale: h.rationale,
            confidence: h.confidence,
            evidence_strength: h.evidenceStrength,
            evidence_status: h.evidenceStatus,
            supporting_findings: h.supportingFindings,
            contradicting_findings: h.contradictingFindings,
            validation_method: h.validationMethod,
            assumptions: h.assumptions,
          })),
        )
        .select("id, ref")
    : { data: [], error: null };
  if (hError) return undo(hError.message);

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
    if (error) return undo(error.message);
  }

  if (openQuestions.length) {
    const { error } = await supabase.from("open_questions").insert(
      openQuestions.map((q, i) => ({
        investigation_id: investigationId,
        analysis_run_id: runId,
        ref: q.ref,
        position: i,
        question: q.question.slice(0, 1000),
        why_it_matters: q.whyItMatters,
        missing_evidence: q.missingEvidence,
      })),
    );
    if (error) return undo(error.message);
  }

  const { error: nError } = await supabase.from("next_steps").insert({
    investigation_id: investigationId,
    analysis_run_id: runId,
    approach: nextStep.approach?.step ?? "establish-facts",
    approach_reason: nextStep.approach?.why ?? "",
    evidence_sufficiency: nextStep.approach?.evidenceSufficiency ?? "partial",
    type: nextStep.type,
    title: nextStep.title,
    detail: nextStep.detail,
    why: nextStep.why,
    why_not_build_yet: nextStep.whyNotBuildYet,
    would_change_if: nextStep.wouldChangeIf,
  });
  if (nError) return undo(nError.message);

  // Research tasks belong to the investigation and outlive the run; don't add one the team already has.
  const { data: existing } = await supabase.from("research_tasks").select("title").eq("investigation_id", investigationId);
  const have = new Set((existing ?? []).map((t) => t.title.trim().toLowerCase()));
  const fresh = researchTasks.filter((t) => !have.has(t.title.trim().toLowerCase()));
  if (fresh.length) {
    const { error } = await supabase.from("research_tasks").insert(
      fresh.map((t, i) => ({
        investigation_id: investigationId,
        analysis_run_id: runId,
        position: i,
        title: t.title.slice(0, 300),
        question: t.question.slice(0, 1000),
        method: t.method,
        method_detail: t.methodDetail,
        priority: t.priority,
        rationale: t.rationale,
        question_ref: t.questionRef ?? null,
        hypothesis_refs: t.hypothesisRefs,
      })),
    );
    if (error) return undo(error.message);
  }
  return { ok: true };
}
