import "server-only";
import { defineProblem, findOpportunities, type DiscoveryInput } from "@/lib/analysis/discovery";
import { saveOpportunities, saveProblem } from "@/lib/analysis/discovery-save";
import { structureRun } from "@/lib/analysis/structure";
import type { AnalysisPack } from "@/lib/analysis/pack";
import type { AnalysisResult } from "@/lib/analysis/schema";
import { getBusinessContext } from "@/lib/data";
import { memoryNotes } from "@/lib/data/memory";
import { createClient } from "@/lib/supabase/server";

/**
 * Defining the problem and finding opportunities, as the signed-in user. Used
 * by the Problem and Opportunities buttons (which count towards the daily AI
 * limit first) and by validation runs, which update both after a verdict.
 */

type Result = { ok: true } | { error: string };

/** What the problem and opportunity steps read: the investigation, its latest analysis and that analysis's artifacts. */
export async function loadDiscoveryInput(investigationId: string): Promise<{ input: DiscoveryInput; runId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: inv } = await supabase.from("investigations").select("id, is_sample, problem, objective").eq("id", investigationId).maybeSingle();
  if (!inv) return { error: "This investigation no longer exists." };
  if (inv.is_sample) return { error: "The sample investigation already has its problem and opportunities." };
  const { data: run } = await supabase
    .from("analysis_runs")
    .select("id, pack, result")
    .eq("investigation_id", investigationId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!run?.result || !run.pack) return { error: "Analyse your data first. The problem definition builds on the findings and hypotheses." };
  const pack = run.pack as unknown as AnalysisPack;
  const [{ data: findings }, { data: hypotheses }, { data: questions }, { data: settled }, memory] = await Promise.all([
    supabase.from("findings").select("ref, kind, title, statement, observed, confidence, position").eq("analysis_run_id", run.id).order("position"),
    supabase.from("hypotheses").select("ref, title, statement, evidence_status, status, assumptions, position, validation_id").eq("analysis_run_id", run.id).order("position"),
    supabase.from("open_questions").select("question, missing_evidence, position").eq("analysis_run_id", run.id).order("position"),
    supabase.from("validations").select("id, hypothesis_title, hypothesis_statement, outcome, settled_at").eq("investigation_id", investigationId).eq("status", "settled").order("settled_at"),
    memoryNotes(supabase, investigationId),
  ]);
  // Hypotheses the team settled that the latest analysis didn't state again still count, as V1, V2…
  const linked = new Set((hypotheses ?? []).map((h) => h.validation_id).filter(Boolean));
  const carried = (settled ?? [])
    .filter((v) => !linked.has(v.id))
    .map((v, i) => ({ ref: `V${i + 1}`, title: v.hypothesis_title, statement: v.hypothesis_statement, evidenceStatus: "validated by the team", status: v.outcome ?? "unclear", assumptions: [] }));
  // Runs saved before their artifacts were rows are read from the run itself.
  const fallback = structureRun(run.result as unknown as AnalysisResult, (ref) => pack.datasets.find((d) => d.ref === ref)?.evidenceId);
  const observedText = (o: unknown) => {
    const v = o as { values?: string; measure?: string } | null;
    return v?.values ? `${v.measure ? `${v.measure}: ` : ""}${v.values}` : undefined;
  };
  return {
    runId: run.id,
    input: {
      context: await getBusinessContext(),
      problem: inv.problem,
      objective: inv.objective,
      pack,
      findings: findings?.length
        ? findings.map((f) => ({ ref: f.ref, kind: f.kind, title: f.title, statement: f.statement, observed: observedText(f.observed), confidence: f.confidence }))
        : fallback.findings.map((f) => ({ ref: f.ref, kind: f.kind, title: f.title, statement: f.statement, observed: observedText(f.observed), confidence: f.confidence })),
      hypotheses: [
        ...(hypotheses?.length
          ? hypotheses.map((h) => ({ ref: h.ref, title: h.title, statement: h.statement, evidenceStatus: h.evidence_status, status: h.status, assumptions: h.assumptions }))
          : fallback.hypotheses.map((h) => ({ ref: h.ref, title: h.title, statement: h.statement, evidenceStatus: h.evidenceStatus, status: "open", assumptions: h.assumptions }))),
        ...carried,
      ],
      openQuestions: questions?.length
        ? questions.map((q) => ({ question: q.question, missingEvidence: q.missing_evidence }))
        : fallback.openQuestions.map((q) => ({ question: q.question, missingEvidence: q.missingEvidence })),
      memory,
    },
  };
}

/** Writes the refined problem definition from the latest analysis. */
export async function defineProblemFor(investigationId: string): Promise<Result> {
  const loaded = await loadDiscoveryInput(investigationId);
  if ("error" in loaded) return loaded;
  const outcome = await defineProblem(loaded.input);
  if (!outcome.ok) return { error: outcome.failure.error };
  const supabase = await createClient();
  const saved = await saveProblem(supabase, investigationId, loaded.runId, outcome.data, loaded.input.pack);
  if ("error" in saved) {
    console.error("problem definition not saved", saved.error);
    return { error: "The problem definition was written but couldn't be saved. Try again." };
  }
  return { ok: true };
}

/** Finds opportunity areas for the current problem definition. Replaces the set. */
export async function findOpportunitiesFor(investigationId: string): Promise<Result> {
  const supabase = await createClient();
  const { data: problem } = await supabase
    .from("problem_definitions")
    .select("id, statement, affected, need, obstacle, business_impact, confidence, confidence_reason, assumptions, finding_refs, hypothesis_refs, cause_status")
    .eq("investigation_id", investigationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!problem) return { error: "Define the problem first. Opportunities build on it." };
  const loaded = await loadDiscoveryInput(investigationId);
  if ("error" in loaded) return loaded;

  const outcome = await findOpportunities(loaded.input, {
    statement: problem.statement,
    affected: problem.affected,
    need: problem.need,
    obstacle: problem.obstacle,
    businessImpact: problem.business_impact,
    confidence: problem.confidence as "low" | "medium" | "high",
    confidenceReason: problem.confidence_reason,
    assumptions: problem.assumptions,
    findings: problem.finding_refs,
    hypotheses: problem.hypothesis_refs,
    evidence: [],
    causeStatus: problem.cause_status === "validated" || problem.cause_status === "likely" ? problem.cause_status : "open",
  });
  if (!outcome.ok) return { error: outcome.failure.error };
  const saved = await saveOpportunities(supabase, investigationId, problem.id, outcome.data, loaded.input.pack);
  if ("error" in saved) {
    console.error("opportunities not saved", saved.error);
    return { error: "The opportunities were found but couldn't be saved. Try again." };
  }
  return { ok: true };
}

