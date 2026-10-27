"use server";

import { revalidatePath } from "next/cache";
import { answerQuestion } from "@/lib/assistant/ask";
import { takeAiAllowance } from "@/lib/ai/usage";
import { requireWorkspace } from "@/lib/auth";
import { getBusinessContext, getInvestigationWorkspace } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { ChatMessage } from "@/lib/types";

/** Team notes and Ask Veyra on an investigation (Milestone 10). */

type Result<T = object> = ({ ok: true } & T) | { error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RETRY = "Something went wrong. Reload the page and try again.";

export async function addNote(investigationId: string, text: string): Promise<Result> {
  const { session } = await requireWorkspace();
  if (!UUID.test(investigationId)) return { error: RETRY };
  const body = text.trim();
  if (!body) return { error: "Write the note first." };
  if (body.length > 4000) return { error: "Shorten the note a little." };
  const supabase = await createClient();
  const { error } = await supabase.from("investigation_notes").insert({ investigation_id: investigationId, body, author_name: session.user.name.slice(0, 200) });
  if (error) return { error: "Couldn't save the note. Try again in a moment." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Only the note's author can delete it (the database checks). */
export async function deleteNote(noteId: string): Promise<Result> {
  await requireWorkspace();
  if (!UUID.test(noteId)) return { error: RETRY };
  const supabase = await createClient();
  const { error, count } = await supabase.from("investigation_notes").delete({ count: "exact" }).eq("id", noteId);
  if (error || !count) return { error: "Only the person who wrote a note can delete it." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Ask Veyra a question about the investigation. The answer comes from its
 * records only; both messages are saved. Counts towards the daily AI limit.
 */
export async function askVeyra(investigationId: string, question: string): Promise<Result<{ question: ChatMessage; reply: ChatMessage }>> {
  const { company } = await requireWorkspace();
  if (!UUID.test(investigationId)) return { error: RETRY };
  const text = question.trim();
  if (!text) return { error: "Ask a question first." };
  if (text.length > 2000) return { error: "Shorten the question a little." };
  const ws = await getInvestigationWorkspace(investigationId);
  if (!ws?.live) return { error: "This investigation no longer exists." };
  if (!process.env.ANTHROPIC_API_KEY) return { error: "AI isn't set up on this server yet." };
  const allowance = await takeAiAllowance(company.id, "ask");
  if ("error" in allowance) return allowance;

  const result = await answerQuestion({ ...ws, live: ws.live }, await getBusinessContext(), ws.live.record.conversation, text);
  if (!result.ok) return { error: result.failure.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([
      { investigation_id: investigationId, role: "user", text },
      { investigation_id: investigationId, role: "assistant", text: result.reply.text.slice(0, 8000), list: result.reply.list ?? [], refs: (result.reply.refs ?? []) as unknown as Json },
    ])
    .select("id, role, text, list, refs, created_at");
  if (error || !data || data.length < 2) return { error: "Veyra answered, but the answer couldn't be saved. Try again." };
  const toMessage = (m: (typeof data)[number]): ChatMessage => ({
    id: m.id,
    role: m.role as ChatMessage["role"],
    text: m.text,
    list: m.list.length ? m.list : undefined,
    refs: m.refs as unknown as ChatMessage["refs"],
    createdAt: m.created_at,
  });
  const q = data.find((m) => m.role === "user")!;
  const a = data.find((m) => m.role === "assistant")!;
  return { ok: true, question: toMessage(q), reply: toMessage(a) };
}
