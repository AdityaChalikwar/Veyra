"use server";

import { revalidatePath } from "next/cache";
import { setUpDemo } from "@/app/(app)/data-sources/actions";
import { requireWorkspace } from "@/lib/auth";
import { APP_DROP, DEMO_FILES, demoFileContent, type DemoFile } from "@/lib/demo/app-drop";
import { deriveTitle, inferTopic } from "@/lib/investigation-text";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { RunRequest } from "@/lib/validation-run/types";
import { processUpload } from "./actions";

/**
 * The full demo (Milestone 10): an investigation at Northwind Home with data
 * complete enough to go all the way from problem to decision. One file — the
 * crash export — is held back, so Veyra has to ask for it.
 */

type Result<T = object> = ({ ok: true } & T) | { error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Uploads one of the demo's files to the investigation, as if the team had uploaded it, and profiles it. */
async function addFile(investigationId: string, workspaceId: string, file: DemoFile): Promise<Result> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("files").select("id").eq("investigation_id", investigationId).eq("name", file.name).maybeSingle();
  if (existing) return { ok: true };
  const content = demoFileContent(file.key);
  const fileId = crypto.randomUUID();
  const path = `${workspaceId}/${investigationId}/${fileId}.csv`;
  const { error } = await supabase
    .from("files")
    .insert({ id: fileId, investigation_id: investigationId, workspace_id: workspaceId, name: file.name, storage_path: path, size_bytes: content.length });
  if (error) return { error: "Couldn't add the demo data. Try again in a moment." };
  const { error: uploadError } = await supabase.storage.from("uploads").upload(path, new Blob([content], { type: "text/csv" }), { contentType: "text/csv" });
  if (uploadError) {
    await supabase.from("files").delete().eq("id", fileId);
    return { error: "Couldn't add the demo data. Try again in a moment." };
  }
  return processUpload(fileId);
}

/**
 * Starts the full demo: Northwind Home's demo data (the Demo ERP and its
 * business context), then the investigation with its problem, answers and
 * three files. Analysing it and everything after is Veyra's real work.
 */
export async function startFullDemo(): Promise<Result<{ id: string }>> {
  const { company } = await requireWorkspace();
  const supabase = await createClient();

  // The demo company's data and context, unless they're already set up.
  const { data: source } = await supabase.from("data_sources").select("id, last_synced_at").eq("connector", "demo-erp").maybeSingle();
  if (!source?.last_synced_at) {
    const demo = await setUpDemo();
    if ("error" in demo) return demo;
  }

  const { data: id, error } = await supabase.rpc("create_investigation", {
    p_workspace_id: company.id,
    p_title: deriveTitle(APP_DROP.title),
    p_problem: APP_DROP.problem,
    p_objective: APP_DROP.objective,
    p_topic: inferTopic(APP_DROP.problem),
    p_triggers: [...APP_DROP.triggers],
    p_outcomes: [...APP_DROP.outcomes],
    p_known_context: APP_DROP.knownContext,
    p_attachments: [],
    p_data_source_ids: [],
    p_plan: null,
    p_questions: APP_DROP.questions.map((q) => ({ question: q.question, hint: "", answer: q.answer })) as Json,
  });
  if (error || !id) return { error: "Couldn't start the demo. Try again in a moment." };
  await supabase.from("investigations").update({ demo_scenario: APP_DROP.key }).eq("id", id);

  for (const file of DEMO_FILES.filter((f) => !f.heldBack)) {
    const added = await addFile(id, company.id, file);
    if ("error" in added) return added;
  }
  revalidatePath("/", "layout");
  return { ok: true, id };
}

/**
 * Adds the demo's held-back file (the crash export) when Veyra asks for crash
 * or stability data, and marks that request as answered. Only for the demo.
 */
export async function addHeldBackDemoFile(runId: string, requestId: string): Promise<Result> {
  const { company } = await requireWorkspace();
  if (!UUID.test(runId) || !/^Q\d{1,2}$/.test(requestId)) return { error: "Something went wrong. Reload the page and try again." };
  const supabase = await createClient();
  const { data: run } = await supabase.from("validation_runs").select("investigation_id, requests").eq("id", runId).maybeSingle();
  if (!run) return { error: "This validation run no longer exists." };
  const { data: inv } = await supabase.from("investigations").select("demo_scenario").eq("id", run.investigation_id).maybeSingle();
  if (inv?.demo_scenario !== APP_DROP.key) return { error: "This isn't the demo investigation." };
  const file = DEMO_FILES.find((f) => f.heldBack)!;
  const added = await addFile(run.investigation_id, company.id, file);
  if ("error" in added) return added;
  const requests = (run.requests as unknown as RunRequest[]).map((r) =>
    r.id === requestId ? { ...r, status: "provided" as const, answerText: `Added ${file.name} to the investigation.` } : r,
  );
  await supabase.from("validation_runs").update({ requests: requests as unknown as Json }).eq("id", runId);
  revalidatePath("/", "layout");
  return { ok: true };
}
