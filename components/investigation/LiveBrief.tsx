"use client";

import { ArrowRight, BookmarkPlus, Check, Copy, Download, FileText, Gavel, Info, Link2, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  recordDecision,
  recordDecisionResult,
  saveLesson,
  setBriefSharing,
  startRecommendedStep,
  writeDecisionBrief,
  type DecisionForm,
} from "@/app/(app)/investigations/decision-actions";
import { BriefDocument } from "@/components/brief/BriefDocument";
import { Button } from "@/components/ui/Button";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { inputClass, textareaClass } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { OUTCOME_LABEL } from "@/lib/brief/build";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { useHydrated } from "@/lib/store/app-store";
import { formatRelative } from "@/lib/time";
import type { DecisionBrief, DecisionOutcome, LiveInvestigation } from "@/lib/types";
import { RunStep } from "./LiveDiscovery";
import { useWorkspace } from "./workspace-context";

const OFFLINE = { error: "Couldn't reach Veyra. Check your connection and try again." };

/** Report tab for the team's own investigation: the Decision Brief, and recording the decision. */
export function LiveBrief({ live }: { live: LiveInvestigation }) {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const params = useSearchParams();
  const mounted = useHydrated();
  const brief = live.record.brief;
  const decision = live.record.decisions[0];
  const id = workspace.investigation.id;
  const [deciding, setDeciding] = useState(params.get("decide") === "1");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("printing-report");
    return () => document.documentElement.classList.remove("printing-report");
  }, []);

  if (!live.run) return <EmptyNote className="mt-6">Analyse your data first. The Decision Brief builds on the findings and what the team has validated.</EmptyNote>;

  if (!brief) {
    return (
      <section className="mt-6 max-w-3xl rounded-xl border-2 border-brand-200 bg-surface p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <FileText className="h-4 w-4 text-brand-600" /> Write the Decision Brief
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          One document for deciding what to do: what was found, what the team believes and how sure it is, what is still unknown, and the
          recommended next step — which may be more research, validating a hypothesis, or no product change at all.
        </p>
        <div className="mt-4">
          <RunStep label="Write the brief" busyLabel="Writing the brief…" run={() => writeDecisionBrief(id)} />
        </div>
      </section>
    );
  }

  const b = brief.content;
  function download() {
    const previous = document.title;
    document.title = `${b.investigationTitle} — Decision Brief`;
    window.addEventListener("afterprint", () => (document.title = previous), { once: true });
    window.print();
  }

  async function startStep() {
    if (!brief) return;
    setStarting(true);
    setStartError(null);
    const r = await startRecommendedStep(brief.id).catch(() => OFFLINE);
    setStarting(false);
    if ("error" in r) return setStartError(r.error);
    if (r.tab.startsWith("report")) setDeciding(true);
    else router.push(routes.investigation(id, r.tab));
  }

  const startLabel: Record<DecisionOutcome, string> = {
    "customer-research": "Add it as a research task",
    "investigate-further": "Add it as a research task",
    "validate-hypothesis": "Go to validation",
    "prioritize-opportunity": "Choose an opportunity",
    "solution-exploration": "Go to the opportunity",
    "no-intervention": "Record this decision",
    escalate: "Record this decision",
  };

  return (
    <div className="mt-6 max-w-4xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-brand-600" /> Decision Brief
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-subtle">Written {formatRelative(brief.createdAt).toLowerCase()}. Rewrite it after new evidence or validations.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-start gap-2">
          <RunStep label="Rewrite" busyLabel="Rewriting…" variant="secondary" run={() => writeDecisionBrief(id)} />
          <Button type="button" variant="secondary" size="sm" onClick={download}>
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
          {!decision && (
            <Button type="button" size="sm" onClick={() => setDeciding(true)}>
              <Gavel className="h-3.5 w-3.5" /> Record decision
            </Button>
          )}
        </div>
      </div>
      <p className="mb-3 flex items-start gap-2 text-xs text-ink-faint">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> For the PDF, choose &ldquo;Save as PDF&rdquo; in the print window.
      </p>
      <ShareControl briefId={brief.id} token={brief.shareToken} />

      <div className="mt-4 rounded-xl border border-line bg-surface p-6 shadow-card sm:p-10">
        <BriefDocument brief={b} decision={decision}>
          {!decision && (
            <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
              <Button type="button" size="sm" onClick={startStep} disabled={starting}>
                {starting ? <Spinner /> : <ArrowRight className="h-3.5 w-3.5" />} {startLabel[b.recommendation.outcome]}
              </Button>
              {startError && <span className="text-[13px] text-danger-600">{startError}</span>}
            </div>
          )}
        </BriefDocument>
      </div>

      {decision && <DecisionResult decisionId={decision.id} result={decision.result} />}
      <Lessons briefId={brief.id} lessons={b.lessons} />

      <DecisionModal open={deciding} onClose={() => setDeciding(false)} live={live} brief={b} />

      {mounted &&
        createPortal(
          <div id="report-print">
            <BriefDocument brief={b} decision={decision} />
          </div>,
          document.body,
        )}
    </div>
  );
}

function ShareControl({ briefId, token }: { briefId: string; token?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = token && typeof window !== "undefined" ? `${window.location.origin}/brief/${token}` : "";

  async function toggle(on: boolean) {
    setBusy(true);
    setError(null);
    const r = await setBriefSharing(briefId, on).catch(() => OFFLINE);
    if ("error" in r) setError(r.error);
    else router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-[13px] text-ink-muted">
        <Link2 className="h-4 w-4 shrink-0" />
        {token ? "Anyone with the link can read this brief (not the rest of the investigation)." : "Share a read-only link to this brief."}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {token && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              navigator.clipboard?.writeText(url).then(() => setCopied(true));
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy link"}
          </Button>
        )}
        <Button type="button" size="sm" variant={token ? "ghost" : "secondary"} disabled={busy} onClick={() => toggle(!token)}>
          {busy && <Spinner />} {token ? "Stop sharing" : "Create link"}
        </Button>
      </div>
      {error && <p className="text-[13px] text-danger-600">{error}</p>}
    </div>
  );
}

function Lessons({ briefId, lessons }: { briefId: string; lessons: DecisionBrief["lessons"] }) {
  const router = useRouter();
  const [saved, setSaved] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  if (!lessons.length) return null;
  async function save(i: number) {
    setError(null);
    const r = await saveLesson(briefId, i).catch(() => OFFLINE);
    if ("error" in r) setError(r.error);
    else {
      setSaved((s) => [...s, i]);
      router.refresh();
    }
  }
  return (
    <section className="mt-5 rounded-xl border border-line bg-surface p-5 shadow-card">
      <h3 className="text-[14px] font-semibold">Lessons for Business Memory</h3>
      <p className="mt-0.5 text-[13px] text-ink-subtle">Veyra suggests these. Save the ones worth remembering; new investigations read them.</p>
      <ul className="mt-3 space-y-2">
        {lessons.map((l, i) => (
          <li key={l.title} className="flex items-start justify-between gap-3 rounded-lg bg-canvas px-3.5 py-2.5">
            <div className="text-[13px]">
              <p className="font-semibold">{l.title}</p>
              <p className="text-ink-muted">{l.body}</p>
            </div>
            <Button type="button" size="sm" variant="secondary" disabled={saved.includes(i)} onClick={() => save(i)}>
              {saved.includes(i) ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />} {saved.includes(i) ? "Saved" : "Save"}
            </Button>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-[13px] text-danger-600">{error}</p>}
    </section>
  );
}

function DecisionResult({ decisionId, result }: { decisionId: string; result: string }) {
  const router = useRouter();
  const [text, setText] = useState(result);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setBusy(true);
    setError(null);
    const r = await recordDecisionResult(decisionId, text).catch(() => OFFLINE);
    if ("error" in r) setError(r.error);
    else router.refresh();
    setBusy(false);
  }
  return (
    <section className="mt-5 rounded-xl border border-line bg-surface p-5 shadow-card">
      <h3 className="text-[14px] font-semibold">What happened</h3>
      <p className="mt-0.5 text-[13px] text-ink-subtle">Come back after the review date and record the result. It goes into Business Memory as an outcome.</p>
      <textarea className={cn(textareaClass, "mt-3")} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Interviews confirmed the login change confused returning users; fix shipped, Android DAU back to 12,900" aria-label="What happened" />
      {error && <p className="mt-2 text-[13px] text-danger-600">{error}</p>}
      <Button type="button" size="sm" className="mt-2" disabled={busy || !text.trim() || text.trim() === result} onClick={save}>
        {busy && <Spinner />} Save result
      </Button>
    </section>
  );
}

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function DecisionModal({ open, onClose, live, brief }: { open: boolean; onClose: () => void; live: LiveInvestigation; brief: DecisionBrief }) {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const rec = brief.recommendation;
  const pursued = live.record.opportunities.find((o) => o.status === "pursuing");
  const [form, setForm] = useState({
    outcome: rec.outcome,
    summary: rec.title,
    rationale: rec.reasoning,
    opportunityId: pursued?.id ?? "",
    escalateTo: rec.escalateTo,
    optionsRejected: "",
    risks: "",
    owner: "",
    successMeasure: "",
    reviewDate: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const unvalidated = workspace.hypotheses.filter((h) => h.status !== "confirmed" && h.status !== "rejected");
  const restsOnCause = ["solution-exploration", "prioritize-opportunity", "no-intervention"].includes(form.outcome);
  const confirmed = workspace.hypotheses.some((h) => h.status === "confirmed");

  async function submit() {
    setBusy(true);
    setError(null);
    const payload: DecisionForm = {
      outcome: form.outcome,
      summary: form.summary,
      rationale: form.rationale,
      opportunityId: form.opportunityId || undefined,
      escalateTo: form.escalateTo,
      optionsRejected: lines(form.optionsRejected),
      risks: lines(form.risks),
      owner: form.owner,
      successMeasure: form.successMeasure,
      reviewDate: form.reviewDate || undefined,
    };
    const r = await recordDecision(workspace.investigation.id, payload).catch(() => OFFLINE);
    setBusy(false);
    if ("error" in r) return setError(r.error);
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title="Record the decision" description="Recording a decision completes the investigation. It's logged with your reasoning in the Decision Log and Business Memory.">
      <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
        <label className="block text-xs font-medium text-ink-muted">
          Decision
          <select className={cn(inputClass, "mt-1")} value={form.outcome} onChange={(e) => set("outcome", e.target.value as DecisionOutcome)}>
            {Object.entries(OUTCOME_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
                {k === rec.outcome ? " (recommended)" : ""}
              </option>
            ))}
          </select>
        </label>
        {restsOnCause && !confirmed && (
          <p className="flex gap-2 rounded-lg bg-uncertain-50 px-3 py-2 text-[12.5px] text-uncertain-600">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> No hypothesis about the cause is validated
            {unvalidated.length ? ` (${unvalidated.map((h) => h.label).join(", ")} still open)` : ""}. You can still decide; the decision will carry this warning.
          </p>
        )}
        <label className="block text-xs font-medium text-ink-muted">
          In one sentence
          <input className={cn(inputClass, "mt-1")} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
        </label>
        <label className="block text-xs font-medium text-ink-muted">
          Why
          <textarea className={cn(textareaClass, "mt-1")} rows={3} value={form.rationale} onChange={(e) => set("rationale", e.target.value)} />
        </label>
        {live.record.opportunities.length > 0 && (
          <label className="block text-xs font-medium text-ink-muted">
            Opportunity (optional)
            <select className={cn(inputClass, "mt-1")} value={form.opportunityId} onChange={(e) => set("opportunityId", e.target.value)}>
              <option value="">None</option>
              {live.record.opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {form.outcome === "escalate" && (
          <label className="block text-xs font-medium text-ink-muted">
            Escalate to
            <input className={cn(inputClass, "mt-1")} value={form.escalateTo} onChange={(e) => set("escalateTo", e.target.value)} placeholder="e.g. Customer Support" />
          </label>
        )}
        <label className="block text-xs font-medium text-ink-muted">
          Options considered and rejected (one per line)
          <textarea className={cn(textareaClass, "mt-1")} rows={2} value={form.optionsRejected} onChange={(e) => set("optionsRejected", e.target.value)} />
        </label>
        <label className="block text-xs font-medium text-ink-muted">
          Risks (one per line)
          <textarea className={cn(textareaClass, "mt-1")} rows={2} value={form.risks} onChange={(e) => set("risks", e.target.value)} />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-ink-muted">
            Owner
            <input className={cn(inputClass, "mt-1")} value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Who follows it up" />
          </label>
          <label className="block text-xs font-medium text-ink-muted">
            Review on
            <input type="date" className={cn(inputClass, "mt-1")} value={form.reviewDate} onChange={(e) => set("reviewDate", e.target.value)} />
          </label>
        </div>
        <label className="block text-xs font-medium text-ink-muted">
          How we&rsquo;ll know it worked
          <input className={cn(inputClass, "mt-1")} value={form.successMeasure} onChange={(e) => set("successMeasure", e.target.value)} placeholder="e.g. Android DAU back above 12,000 within 4 weeks" />
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-danger-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={busy || !form.summary.trim()} onClick={submit}>
          {busy ? <Spinner /> : <Gavel className="h-3.5 w-3.5" />} Record decision
        </Button>
      </div>
    </Modal>
  );
}
