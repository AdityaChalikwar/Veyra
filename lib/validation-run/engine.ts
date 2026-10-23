import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assessEvidence } from "@/lib/analysis/confidence";
import { defineProblemFor, findOpportunitiesFor } from "@/lib/analysis/discovery-run";
import { cleanNeeds } from "@/lib/analysis/evidence-needs";
import { formatRange } from "@/lib/analysis/format";
import { draftValidationPlan } from "@/lib/analysis/validation";
import { writeBriefFor } from "@/lib/brief/write";
import { getBusinessContext } from "@/lib/data";
import { rememberValidation } from "@/lib/data/memory";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { DatasetProfile } from "@/lib/types";
import { challenge, designDataTests, designOtherEvidence, judge, labelTexts, searchWeb, type Background } from "./ai";
import { loadTable } from "./data";
import { runTest, TEST_KINDS, type Table, type TestKind } from "./tests";
import {
  ACTIVE_PHASES,
  describeResult,
  type FollowThrough,
  type RunDesign,
  type RunPhase,
  type RunRequest,
  type RunResult,
  type RunStep,
  type RunVerdict,
} from "./types";

/**
 * Runs a validation, one phase at a time: plan → gather (design the tests, and
 * ask for anything important Veyra can't reach) → test → judge → settle →
 * follow through. Each call to advanceRun does one phase (or as much of
 * testing as fits) under a lease, so the run continues across requests and
 * never runs twice at once. Runs as the signed-in user: the database's rules
 * decide what it may read and write.
 */

type Client = SupabaseClient<Database>;
type RunRow = Database["public"]["Tables"]["validation_runs"]["Row"];

const LEASE_MS = 280_000;
/** How long one advance may keep working before handing over to the next. */
const BUDGET_MS = 200_000;

const now = () => new Date().toISOString();
const step = (label: string, detail?: string, state: RunStep["state"] = "done"): RunStep => ({ at: now(), label, detail, state });

/** Starts a run for a validation. The validation must not be settled. */
export async function createRun(supabase: Client, validationId: string, investigationId: string): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from("validation_runs")
    .insert({ validation_id: validationId, investigation_id: investigationId, steps: [step("Started")] as unknown as Json })
    .select("id")
    .single();
  return error || !data ? { error: "Couldn't start the validation. Try again in a moment." } : { id: data.id };
}

export type AdvanceResult = { phase: RunPhase; more: boolean } | { busy: true } | { error: string };

export async function advanceRun(runId: string): Promise<AdvanceResult> {
  const supabase = await createClient();
  const nowIso = now();
  const { data: claimed } = await supabase
    .from("validation_runs")
    .update({ lease_until: new Date(Date.now() + LEASE_MS).toISOString() })
    .eq("id", runId)
    .in("phase", ACTIVE_PHASES)
    .or(`lease_until.is.null,lease_until.lt.${nowIso}`)
    .select("*")
    .maybeSingle();
  if (!claimed) {
    const { data: row } = await supabase.from("validation_runs").select("phase").eq("id", runId).maybeSingle();
    if (!row) return { error: "This validation run no longer exists." };
    return ACTIVE_PHASES.includes(row.phase as RunPhase) ? { busy: true } : { phase: row.phase as RunPhase, more: false };
  }

  const run = new Run(supabase, claimed);
  try {
    await run.advance();
  } catch (e) {
    console.error("validation run failed", e);
    run.patch.phase = "failed";
    run.patch.error = "Something went wrong while running this validation. Run it again.";
  }
  await run.save(true);
  return { phase: run.phase, more: ACTIVE_PHASES.includes(run.phase) };
}

class Run {
  patch: Partial<Database["public"]["Tables"]["validation_runs"]["Update"]> = {};
  private started = Date.now();
  private steps: RunStep[];
  private tables = new Map<string, { table: Table; name: string } | { error: string }>();

  constructor(
    private supabase: Client,
    private row: RunRow,
  ) {
    this.steps = (row.steps as unknown as RunStep[]) ?? [];
  }

  get phase(): RunPhase {
    return (this.patch.phase ?? this.row.phase) as RunPhase;
  }
  private get design(): RunDesign | undefined {
    return (this.patch.design ?? this.row.design ?? undefined) as unknown as RunDesign | undefined;
  }
  private get requests(): RunRequest[] {
    return (this.patch.requests ?? this.row.requests) as unknown as RunRequest[];
  }
  private get results(): RunResult[] {
    return (this.patch.results ?? this.row.results) as unknown as RunResult[];
  }
  private log(label: string, detail?: string, state?: RunStep["state"]) {
    this.steps.push(step(label, detail, state));
    this.patch.steps = this.steps as unknown as Json;
  }
  private set(key: "design" | "requests" | "results" | "verdict" | "follow_through", value: unknown) {
    this.patch[key] = value as Json;
  }
  private timeLeft() {
    return Date.now() - this.started < BUDGET_MS;
  }

  async save(release: boolean) {
    await this.supabase
      .from("validation_runs")
      .update({ ...this.patch, ...(release && { lease_until: null }), ...(this.phase === "completed" && { completed_at: now() }) })
      .eq("id", this.row.id);
  }

  async advance() {
    switch (this.row.phase as RunPhase) {
      case "planning":
        return this.plan();
      case "gathering":
        return this.gather();
      case "testing":
        return this.test();
      case "judging":
        return this.judge();
      case "settling":
        return this.settle();
      case "follow-through":
        return this.followThrough();
    }
  }

  /* ── Context ── */

  private async load() {
    const s = this.supabase;
    const [{ data: v }, { data: inv }, { data: evidence }, { data: snaps }, { data: hyp }] = await Promise.all([
      s.from("validations").select("*").eq("id", this.row.validation_id).single(),
      s.from("investigations").select("problem, workspace_id").eq("id", this.row.investigation_id).single(),
      s.from("evidence").select("id, name, source, profile, snapshot_id, created_at").eq("investigation_id", this.row.investigation_id).not("profile", "is", null).order("created_at"),
      s.from("dataset_snapshots").select("id, name, source_name, profile, source_dataset_id, created_at").order("created_at", { ascending: false }).limit(50),
      s.from("hypotheses").select("ref, title, statement, assumptions, validation_method, evidence_status").eq("validation_id", this.row.validation_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!v || !inv) throw new Error("validation or investigation missing");
    const inInvestigation = new Set((evidence ?? []).map((e) => e.snapshot_id).filter(Boolean));
    const seen = new Set<string>();
    const available = (snaps ?? []).filter((x) => !inInvestigation.has(x.id) && !seen.has(x.source_dataset_id) && seen.add(x.source_dataset_id));
    const refs = new Map<string, { kind: "evidence" | "snapshot"; id: string; name: string }>();
    const lines: string[] = [];
    (evidence ?? []).forEach((e, i) => {
      refs.set(`E${i + 1}`, { kind: "evidence", id: e.id, name: e.name });
      lines.push(`E${i + 1}: ${e.name} (${e.source}) — ${describeProfile(e.profile as unknown as DatasetProfile)}`);
    });
    available.forEach((x, i) => {
      refs.set(`S${i + 1}`, { kind: "snapshot", id: x.id, name: x.name });
      lines.push(`S${i + 1} (synced from ${x.source_name}, not yet in this investigation): ${x.name} — ${describeProfile(x.profile as unknown as DatasetProfile)}`);
    });
    const answers = this.requests
      .filter((r) => r.status === "provided" && r.answerText)
      .map((r) => `- ${r.what}: ${r.answerText}`)
      .join("\n");
    const design = this.design;
    const background: Background = {
      problem: inv.problem,
      hypothesis: { ref: hyp?.ref ?? "H", title: v.hypothesis_title, statement: v.hypothesis_statement, assumptions: hyp?.assumptions ?? [] },
      plan: design?.plan ?? { method: v.method, test: v.test, confirmIf: v.confirm_if, rejectIf: v.reject_if, needs: cleanNeeds(v.evidence_needed) },
      datasets: lines.join("\n"),
      answers,
    };
    return { v, inv, hyp, refs, background };
  }

  private async table(evidenceId: string) {
    if (!this.tables.has(evidenceId)) this.tables.set(evidenceId, await loadTable(this.supabase, evidenceId));
    return this.tables.get(evidenceId)!;
  }

  /* ── 1. Plan: draft what's missing, then fix it for this run ── */

  private async plan() {
    const { v, inv, hyp, background } = await this.load();
    let plan = background.plan;
    if (!plan.test.trim() || !plan.confirmIf.trim() || !plan.rejectIf.trim() || !plan.needs.length) {
      const { data: run } = await this.supabase
        .from("analysis_runs")
        .select("pack")
        .eq("investigation_id", this.row.investigation_id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const drafted = await draftValidationPlan(
        await getBusinessContext(),
        inv.problem,
        (run?.pack ?? { datasets: [] }) as never,
        { ref: hyp?.ref ?? "H", title: v.hypothesis_title, statement: v.hypothesis_statement, assumptions: hyp?.assumptions ?? [], validationMethod: hyp?.validation_method ?? v.test, evidenceStatus: hyp?.evidence_status ?? "" },
        [],
      );
      if (!drafted.ok) {
        this.patch.phase = "failed";
        this.patch.error = drafted.failure.error;
        return;
      }
      // Fill in only what the team hadn't written.
      const d = drafted.data;
      plan = {
        method: plan.method.trim() || d.method,
        test: plan.test.trim() || d.test,
        confirmIf: plan.confirmIf.trim() || d.confirmIf,
        rejectIf: plan.rejectIf.trim() || d.rejectIf,
        needs: plan.needs.length ? plan.needs : cleanNeeds(d.evidenceNeeded),
      };
      await this.supabase
        .from("validations")
        .update({ method: plan.method, test: plan.test, confirm_if: plan.confirmIf, reject_if: plan.rejectIf, evidence_needed: plan.needs as unknown as Json })
        .eq("id", v.id);
      this.log("Planned the test", `Confirmed if: ${plan.confirmIf} Rejected if: ${plan.rejectIf}`);
    }
    this.log("Fixed the plan before looking at any results", `${plan.needs.length} piece${plan.needs.length === 1 ? "" : "s"} of evidence needed`);
    this.set("design", { plan, tests: [], texts: [], web: [], added: [] } satisfies RunDesign);
    this.patch.phase = "gathering";
    await this.supabase.from("validations").update({ status: "in-progress" }).eq("id", v.id).eq("status", "planned");
  }

  /* ── 2. Gather: design the tests, add synced data, ask for what's out of reach ── */

  private async gather() {
    const { refs, background } = await this.load();
    const design = this.design!;
    const data = await designDataTests(background);
    if (!data.ok) {
      this.patch.phase = "failed";
      this.patch.error = data.failure.error;
      return;
    }

    // Synced datasets the tests need are added to the investigation first.
    const added: string[] = [...design.added];
    const evidenceIdFor = async (ref: string): Promise<{ id: string; name: string } | null> => {
      const r = refs.get(ref.trim().toUpperCase());
      if (!r) return null;
      if (r.kind === "evidence") return { id: r.id, name: r.name };
      const id = await this.addSnapshot(r.id);
      if (id) added.push(r.name);
      return id ? { id, name: r.name } : null;
    };

    const tests: RunDesign["tests"] = [];
    for (const [i, t] of data.data.tests.slice(0, 6).entries()) {
      if (!(t.kind in TEST_KINDS)) continue;
      const ev = await evidenceIdFor(t.evidence);
      if (!ev) continue;
      tests.push({
        id: `T${i + 1}`,
        needId: t.needId,
        evidenceId: ev.id,
        dataset: ev.name,
        why: t.why,
        kind: t.kind as TestKind,
        metric: t.metric,
        metricB: t.metricB,
        dateColumn: t.dateColumn,
        splitDate: t.splitDate,
        groupColumn: t.groupColumn,
        filterColumn: t.filterColumn,
        filterValue: t.filterValue,
        hitColumn: t.hitColumn,
        hitValue: t.hitValue,
        aggregate: t.aggregate === "mean" ? "mean" : "sum",
        windowDays: Math.max(0, Math.min(90, Math.round(t.windowDays || 0))),
      });
    }

    const other = await designOtherEvidence(background, tests.map((t) => `- ${t.needId}: ${TEST_KINDS[t.kind]} on ${t.dataset} — ${t.why}`).join("\n"));
    const texts: RunDesign["texts"] = [];
    let web: RunDesign["web"] = [];
    let missing: RunRequest[] = [];
    if (other.ok) {
      for (const [i, x] of other.data.textAnalyses.slice(0, 2).entries()) {
        const ev = await evidenceIdFor(x.evidence);
        if (ev && x.labels.length) texts.push({ id: `X${i + 1}`, needId: x.needId, evidenceId: ev.id, dataset: ev.name, textColumn: x.textColumn, question: x.question, labels: x.labels.slice(0, 6) });
      }
      web = other.data.webQueries.slice(0, 3);
      missing = other.data.missing.slice(0, 4).map((m, i) => ({ id: `Q${i + 1}`, ...m, status: "open" as const }));
    } else {
      this.log("Couldn't plan the other evidence", other.failure.error, "warn");
    }

    // Ask once. If the team already answered, don't ask again.
    const asked = this.requests;
    const requests = asked.length || this.row.proceed_without ? asked : missing;

    this.set("design", { ...design, tests, texts, web, added } satisfies RunDesign);
    this.log(
      "Designed the tests",
      [`${tests.length} data test${tests.length === 1 ? "" : "s"}`, texts.length && `${texts.length} text review${texts.length === 1 ? "" : "s"}`, web.length && `${web.length} web search${web.length === 1 ? "" : "es"}`]
        .filter(Boolean)
        .join(", "),
    );
    if (added.length > design.added.length) this.log("Added data from your connected sources", added.slice(design.added.length).join(", "));

    if (!asked.length && requests.some((r) => r.status === "open")) {
      this.set("requests", requests);
      this.log("Some evidence is out of reach", `Veyra can go ahead without it, or you can add it for a stronger verdict.`, "warn");
      this.patch.phase = "needs-input";
      return;
    }
    this.patch.phase = "testing";
  }

  /** Adds a synced dataset to the investigation as evidence (as the Evidence tab does). */
  private async addSnapshot(snapshotId: string): Promise<string | null> {
    const s = this.supabase;
    const { data: existing } = await s.from("evidence").select("id").eq("investigation_id", this.row.investigation_id).eq("snapshot_id", snapshotId).maybeSingle();
    if (existing) return existing.id;
    const { data: snap } = await s.from("dataset_snapshots").select("id, data_source_id, name, source_name, coverage, summary, profile, metrics").eq("id", snapshotId).maybeSingle();
    if (!snap) return null;
    const trust = assessEvidence(snap.profile as unknown as DatasetProfile, { connected: true });
    const { data, error } = await s
      .from("evidence")
      .insert({
        investigation_id: this.row.investigation_id,
        workspace_id: this.row.workspace_id,
        snapshot_id: snap.id,
        source_kind: "connector",
        data_source_id: snap.data_source_id,
        confidence: trust.level,
        metadata: { confidenceReason: trust.reason, addedBy: "veyra-validation" },
        name: snap.name,
        source: snap.source_name,
        format: "dataset",
        category: "company-data",
        coverage: snap.coverage,
        summary: snap.summary,
        profile: snap.profile,
        metrics: snap.metrics,
      })
      .select("id")
      .single();
    return error || !data ? null : data.id;
  }

  /* ── 3. Test: data tests in code, then text, then the web ── */

  private async test() {
    const design = { ...this.design! };
    const results = [...this.results];
    const { background } = await this.load();

    // The team's typed answers, and what was skipped, become results too.
    for (const r of this.requests) {
      if (results.some((x) => x.id === r.id)) continue;
      if (r.status === "provided" && r.answerText) results.push({ id: r.id, kind: "answer", needId: r.needId, what: r.what, text: r.answerText });
      if (r.status === "skipped") results.push({ id: r.id, kind: "skipped", needId: r.needId, what: r.what, reason: "Not available; the team went ahead without it." });
    }

    for (const t of design.tests) {
      if (t.done) continue;
      if (!this.timeLeft()) return this.saveProgress(design, results);
      const loaded = await this.table(t.evidenceId);
      const outcome = "error" in loaded ? { ok: false as const, title: TEST_KINDS[t.kind], reason: loaded.error } : runTest(loaded.table, t);
      results.push({ id: t.id, kind: "data", needId: t.needId, evidenceId: t.evidenceId, dataset: t.dataset, why: t.why, spec: t, outcome });
      t.done = true;
      this.log(outcome.ok ? `Ran: ${outcome.title}` : `Couldn't run: ${outcome.title}`, outcome.ok ? outcome.summary : outcome.reason, outcome.ok ? "done" : "warn");
    }

    for (const x of design.texts) {
      if (x.done) continue;
      if (!this.timeLeft()) return this.saveProgress(design, results);
      x.done = true;
      const loaded = await this.table(x.evidenceId);
      if ("error" in loaded) {
        this.log(`Couldn't read ${x.dataset}`, loaded.error, "warn");
        continue;
      }
      const c = loaded.table.headers.findIndex((h) => h.toLowerCase() === x.textColumn.toLowerCase());
      const rows = c < 0 ? [] : loaded.table.rows.map((r) => (r[c] ?? "").trim()).filter((t) => t.length > 3);
      if (!rows.length) {
        this.log(`No text to read in ${x.dataset}`, `Column "${x.textColumn}" is empty or missing.`, "warn");
        continue;
      }
      // An even sample of up to 150 texts; the counts are made in code from Claude's labels.
      const stride = Math.max(1, Math.floor(rows.length / 150));
      const sample = rows.filter((_, i) => i % stride === 0).slice(0, 150);
      const labelled = await labelTexts(background, x.question, x.labels, sample);
      if (!labelled.ok) {
        this.log(`Couldn't read ${x.dataset}`, labelled.failure.error, "warn");
        continue;
      }
      const allowed = [...x.labels, "none of these"];
      const counts = new Map(allowed.map((l) => [l, 0]));
      for (const l of labelled.data.labels) {
        const label = allowed.find((a) => a.toLowerCase() === l.label.trim().toLowerCase()) ?? "none of these";
        if (l.row >= 1 && l.row <= sample.length) counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      results.push({
        id: x.id,
        kind: "text",
        needId: x.needId,
        evidenceId: x.evidenceId,
        dataset: x.dataset,
        question: x.question,
        counts: [...counts].map(([label, count]) => ({ label, count })).filter((c) => c.count > 0),
        read: sample.length,
        total: rows.length,
        examples: labelled.data.examples
          .filter((n) => n >= 1 && n <= sample.length)
          .slice(0, 3)
          .map((n) => sample[n - 1].slice(0, 240)),
      });
      this.log(`Read ${sample.length} texts in ${x.dataset}`, x.question);
    }

    if (!design.webDone && design.web.length) {
      if (!this.timeLeft()) return this.saveProgress(design, results);
      design.webDone = true;
      const found = await searchWeb(background, design.web);
      if (!found.ok) this.log("The web search didn't work", found.failure.error, "warn");
      else {
        found.data.forEach((f, i) => results.push({ id: `W${i + 1}`, kind: "web", needId: f.needId, finding: f.finding, sources: f.sources }));
        this.log("Searched the web", found.data.length ? `${found.data.length} finding${found.data.length === 1 ? "" : "s"} with sources` : "Nothing relevant found");
      }
    }

    this.set("design", design);
    this.set("results", results);
    this.patch.phase = "judging";
  }

  private saveProgress(design: RunDesign, results: RunResult[]) {
    this.set("design", design);
    this.set("results", results);
  }

  /* ── 4. Judge, then try to knock the verdict down; limits applied in code ── */

  private async judge() {
    const { background } = await this.load();
    const results = this.results;
    const usable = results.filter((r) => r.kind !== "skipped" && !(r.kind === "data" && !r.outcome.ok));
    if (!usable.length) {
      this.set("verdict", {
        outcome: "unclear",
        confidence: "low",
        reasoning: "Veyra couldn't gather any evidence it could rely on for this hypothesis, so it can't be settled yet.",
        challenges: [],
        holds: "holds",
        strengthen: this.requests.map((r) => r.what),
        assessments: [],
        capped: ["No usable evidence."],
      } satisfies RunVerdict);
      this.log("Verdict: unclear", "No usable evidence.", "warn");
      this.patch.phase = "settling";
      return;
    }
    const text = results.map((r) => `${r.id} [${r.needId}] ${describeResult(r)}`).join("\n");
    const first = await judge(background, text);
    if (!first.ok) {
      this.patch.phase = "failed";
      this.patch.error = first.failure.error;
      return;
    }
    this.log(`First verdict: ${first.data.outcome}`, first.data.reasoning);
    const second = await challenge(background, text, first.data);
    let outcome = first.data.outcome;
    let confidence = first.data.confidence;
    let holds: RunVerdict["holds"] = "holds";
    let challenges: string[] = [];
    if (second.ok) {
      holds = second.data.holds;
      challenges = second.data.challenges.slice(0, 4);
      outcome = second.data.outcome;
      confidence = second.data.confidence;
      this.log(
        holds === "holds" ? "The verdict held up when challenged" : holds === "weaker" ? "The challenge weakened the verdict" : "The challenge overturned the verdict",
        challenges.join(" "),
        holds === "holds" ? "done" : "warn",
      );
    } else {
      this.log("Couldn't challenge the verdict", second.failure.error, "warn");
    }

    // Limits in code: the verdict can't be surer than its evidence.
    const capped: string[] = [];
    const ids = new Set(results.map((r) => r.id));
    const assessments = first.data.assessments.filter((a) => ids.has(a.id));
    const cap = (to: "low" | "medium", why: string) => {
      const rank = { low: 0, medium: 1, high: 2 };
      if (rank[confidence] > rank[to]) {
        confidence = to;
        capped.push(why);
      }
    };
    const dataOk = results.filter((r) => r.kind === "data" && r.outcome.ok);
    if (!dataOk.length) cap("medium", "Capped at medium: no data test could run, so the verdict rests on text, the web or the team's answers.");
    if (this.requests.some((r) => r.status === "skipped" && r.impact === "high")) cap("medium", "Capped at medium: important evidence was skipped.");
    if (!second.ok) cap("medium", "Capped at medium: the verdict couldn't be challenged.");
    const relation = (id: string) => assessments.find((a) => a.id === id)?.relation;
    if (outcome === "confirmed" && !results.some((r) => relation(r.id) === "supports")) {
      outcome = "unclear";
      capped.push("Changed to unclear: no result supports the hypothesis.");
    }
    if (outcome === "rejected" && !results.some((r) => relation(r.id) === "contradicts")) {
      outcome = "unclear";
      capped.push("Changed to unclear: no result contradicts the hypothesis.");
    }

    this.set("verdict", {
      outcome,
      confidence,
      reasoning: first.data.reasoning,
      challenges,
      holds,
      strengthen: [...new Set([...first.data.strengthen, ...this.requests.filter((r) => r.status === "skipped").map((r) => r.what)])].slice(0, 5),
      assessments,
      capped,
    } satisfies RunVerdict);
    this.log(`Verdict: ${outcome}`, `${confidence} confidence${capped.length ? ` · ${capped.join(" ")}` : ""}`);
    this.patch.phase = "settling";
  }

  /* ── 5. Settle: the evidence and the verdict go on the validation ── */

  private async settle() {
    const s = this.supabase;
    const verdict = (this.patch.verdict ?? this.row.verdict) as unknown as RunVerdict;
    const { data: v } = await s.from("validations").select("id, status, hypothesis_title, hypothesis_statement").eq("id", this.row.validation_id).single();
    if (!v) throw new Error("validation missing");
    if (v.status === "settled") {
      // The team settled it while Veyra worked: their call stands.
      this.log("Kept the team's call", "The hypothesis was settled by the team while Veyra worked.", "warn");
      this.patch.phase = "completed";
      return;
    }
    // Veyra's evidence from earlier runs is replaced; the team's own notes stay.
    await s.from("validation_notes").delete().eq("validation_id", v.id).not("run_id", "is", null);
    const kinds = { data: "test-result", text: "text-analysis", web: "web", answer: "answer" } as const;
    const notes = this.results
      .filter((r): r is Exclude<RunResult, { kind: "skipped" }> => r.kind !== "skipped")
      .filter((r) => !(r.kind === "data" && !r.outcome.ok))
      .map((r) => ({
        validation_id: v.id,
        investigation_id: this.row.investigation_id,
        kind: kinds[r.kind],
        body: describeResult(r).slice(0, 4000),
        relation: verdict.assessments.find((a) => a.id === r.id)?.relation ?? "neutral",
        need_id: r.needId || null,
        run_id: this.row.id,
        detail: r as unknown as Json,
      }));
    if (!notes.length) {
      notes.push({
        validation_id: v.id,
        investigation_id: this.row.investigation_id,
        kind: "test-result",
        body: "Veyra looked for evidence but none it could use was available.",
        relation: "neutral",
        need_id: null,
        run_id: this.row.id,
        detail: null as unknown as Json,
      });
    }
    const { error: notesError } = await s.from("validation_notes").insert(notes);
    if (notesError) throw new Error(notesError.message);
    const reason = [verdict.reasoning, verdict.capped.join(" ")].filter(Boolean).join(" ").slice(0, 2000);
    const { error } = await s
      .from("validations")
      .update({ status: "settled", outcome: verdict.outcome, reason, settled_by_kind: "veyra", confidence: verdict.confidence })
      .eq("id", v.id);
    if (error) throw new Error(error.message);
    await rememberValidation(
      s,
      { id: v.id, workspaceId: this.row.workspace_id, investigationId: this.row.investigation_id, title: v.hypothesis_title, statement: v.hypothesis_statement },
      verdict.outcome,
      verdict.reasoning,
      "veyra",
    );
    this.log(`Settled: ${verdict.outcome}`, "Saved with its evidence, and to Business Memory.");

    // What to bring up to date next.
    const [{ data: problem }, { data: opps }, { data: brief }] = await Promise.all([
      s.from("problem_definitions").select("id").eq("investigation_id", this.row.investigation_id).limit(1).maybeSingle(),
      s.from("opportunities").select("status").eq("investigation_id", this.row.investigation_id),
      s.from("decision_briefs").select("id").eq("investigation_id", this.row.investigation_id).limit(1).maybeSingle(),
    ]);
    const confirmed = verdict.outcome === "confirmed";
    const pursuing = (opps ?? []).some((o) => o.status === "pursuing");
    const follow: FollowThrough = {
      // Unclear changes nothing in the problem; rejected drops a possible cause; confirmed fills in the cause.
      problem: confirmed || (problem && verdict.outcome === "rejected") ? "todo" : "skipped",
      opportunities: confirmed ? (pursuing ? "skipped" : "todo") : "skipped",
      brief: brief || confirmed ? "todo" : "skipped",
    };
    this.set("follow_through", follow);
    this.patch.phase = Object.values(follow).includes("todo") ? "follow-through" : "completed";
  }

  /* ── 6. Follow through: problem, opportunities, brief — one per call ── */

  private async followThrough() {
    const follow = { ...(this.row.follow_through as unknown as FollowThrough) };
    const next = (["problem", "opportunities", "brief"] as const).find((k) => follow[k] === "todo");
    if (next) {
      const id = this.row.investigation_id;
      const done = { problem: "Redefined the problem", opportunities: "Refreshed the opportunities", brief: "Rewrote the Decision Brief" }[next];
      const failed = { problem: "Couldn't redefine the problem", opportunities: "Couldn't refresh the opportunities", brief: "Couldn't rewrite the Decision Brief" }[next];
      const result = next === "problem" ? await defineProblemFor(id) : next === "opportunities" ? await findOpportunitiesFor(id) : await writeBriefFor(id);
      follow[next] = "ok" in result ? "done" : `failed: ${result.error}`;
      if ("ok" in result) this.log(done);
      else this.log(failed, result.error, "warn");
      this.set("follow_through", follow);
    }
    if (!(["problem", "opportunities", "brief"] as const).some((k) => follow[k] === "todo")) {
      this.patch.phase = "completed";
      this.log("Done");
    }
  }
}

/** A dataset as the design step sees it: rows, period and each column's type and values, from its profile. */
export function describeProfile(p: DatasetProfile | null): string {
  if (!p) return "no profile";
  const fmt = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });
  const cols = p.columns.map((c) => {
    if (c.type === "number" && c.number) return `${c.name} (number, ${fmt(c.number.min)}–${fmt(c.number.max)})`;
    if (c.type === "date" && c.date) return `${c.name} (date, ${c.date.from} to ${c.date.to})`;
    if ((c.type === "category" || c.type === "boolean") && c.top?.length) return `${c.name} (${c.type}: ${c.top.slice(0, 8).map((t) => t.value).join(", ")})`;
    if (c.type === "text") return `${c.name} (free text)`;
    return `${c.name} (${c.type})`;
  });
  const period = p.dateRange ? `; ${formatRange(p.dateRange.from, p.dateRange.to)}` : "";
  return `${p.rowCount.toLocaleString("en-GB")} rows${period}. Columns: ${cols.join("; ")}`;
}

