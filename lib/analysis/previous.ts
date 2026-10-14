import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { PreviousArtifacts } from "./run";

/** The investigation so far — the latest finished run's artifacts and every research task — for the next run to build on. */
export async function loadPrevious(
  supabase: SupabaseClient<Database>,
  investigationId: string,
  currentRunId: string,
): Promise<PreviousArtifacts | undefined> {
  const [{ data: last }, { data: tasks }] = await Promise.all([
    supabase
      .from("analysis_runs")
      .select(
        "id, completed_at, findings (ref, kind, statement, confidence, position), hypotheses (ref, statement, evidence_status, status, position), open_questions (ref, question, position)",
      )
      .eq("investigation_id", investigationId)
      .eq("status", "completed")
      .neq("id", currentRunId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("research_tasks").select("title, question, method, status, outcome, created_at").eq("investigation_id", investigationId).order("created_at"),
  ]);
  if (!last && !tasks?.length) return undefined;
  const byPosition = <T extends { position: number }>(rows: T[] | undefined) => [...(rows ?? [])].sort((a, b) => a.position - b.position);
  return {
    ranAt: last?.completed_at ?? new Date().toISOString(),
    findings: byPosition(last?.findings).map((f) => ({ ref: f.ref, kind: f.kind, statement: f.statement, confidence: f.confidence })),
    hypotheses: byPosition(last?.hypotheses).map((h) => ({ ref: h.ref, statement: h.statement, evidenceStatus: h.evidence_status, status: h.status })),
    openQuestions: byPosition(last?.open_questions).map((q) => ({ ref: q.ref, question: q.question })),
    researchTasks: (tasks ?? []).map((t) => ({ title: t.title, question: t.question, method: t.method, status: t.status, outcome: t.outcome })),
  };
}
