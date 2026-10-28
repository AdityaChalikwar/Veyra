import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { ANALYSIS_MODEL, apiFailure, formatOf, type StepFailure, type Usage } from "@/lib/analysis/run";

/**
 * One structured Claude call with the web search tool. Returns the parsed
 * answer and every page the searches returned, so callers keep only sources
 * that really came back from a search.
 */
export async function webSearchStep<T>(opts: {
  system: string;
  context: string;
  instruction: string;
  schema: z.ZodType<T>;
  /** The answer's first key, to find the JSON if text comes before it. */
  firstKey: string;
  maxUses: number;
}): Promise<{ ok: true; data: T; found: Map<string, string>; usage: Usage } | { ok: false; failure: StepFailure }> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, failure: { status: "failed", error: "AI isn't set up on this server yet." } };
  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: [
        { type: "text", text: opts.context, cache_control: { type: "ephemeral" } },
        { type: "text", text: opts.instruction },
      ],
    },
  ];
  const found = new Map<string, string>();
  const usage = { inputTokens: 0, outputTokens: 0 };
  try {
    let message: Anthropic.Beta.BetaMessage | undefined;
    for (let turn = 0; turn < 4; turn++) {
      message = await client.beta.messages
        .stream({
          model: ANALYSIS_MODEL,
          max_tokens: 16_000,
          thinking: { type: "adaptive" },
          output_config: { effort: "medium", format: formatOf(opts.schema as never) },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: opts.system,
          tools: [{ type: "web_search_20260209", name: "web_search", max_uses: opts.maxUses }],
          messages,
        })
        .finalMessage();
      usage.inputTokens += message.usage.input_tokens;
      usage.outputTokens += message.usage.output_tokens;
      // Searches from every turn count, not just the last.
      for (const block of message.content) {
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) if (r.type === "web_search_result") found.set(r.url, r.title);
        }
      }
      if (message.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: message.content });
    }
    if (!message) return { ok: false, failure: { status: "failed", error: "The web search didn't return." } };
    if (message.stop_reason === "refusal") return { ok: false, failure: { status: "refused", error: "Claude declined this web search." } };
    const text = message.content.flatMap((bl) => (bl.type === "text" ? [bl.text] : [])).join("");
    const last = text.lastIndexOf(`{"${opts.firstKey}"`);
    for (const candidate of [text, last >= 0 ? text.slice(last) : ""]) {
      try {
        const r = opts.schema.safeParse(JSON.parse(candidate));
        if (r.success) return { ok: true, data: r.data, found, usage };
      } catch {
        // next candidate
      }
    }
    return { ok: false, failure: { status: "failed", usage, error: "The web search answer wasn't in the expected form." } };
  } catch (error) {
    return { ok: false, failure: apiFailure(error) };
  }
}
