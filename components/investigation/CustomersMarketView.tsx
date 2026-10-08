"use client";

import { BookOpen, Globe2, MessagesSquare, Scale, Search, Upload, Users } from "lucide-react";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { CustomerTool } from "@/lib/types";
import { ComingNext } from "./ComingNext";
import { useWorkspace } from "./workspace-context";

const toolStatus: Record<CustomerTool["status"], { label: string; className: string }> = {
  used: { label: "Used", className: "bg-confirmed-50 text-confirmed-600" },
  recommended: { label: "Recommended next", className: "bg-brand-50 text-brand-700" },
  later: { label: "Later", className: "bg-slate-100 text-slate-600" },
  "not-relevant": { label: "Not relevant here", className: "border border-dashed border-slate-300 text-slate-500" },
};

/**
 * Customer understanding and market context. Frameworks appear as tools with a
 * reason for (not) using them — never as mandatory steps.
 */
export function CustomersMarketView() {
  const { workspace, running, analyzeFeedback, runResearch, openInterviewGuide, openAddEvidence, openDetail } = useWorkspace();
  const { customers, market } = workspace;
  const external = workspace.evidence.filter((e) => e.category === "public-research" || e.category === "uploaded-research");
  const competitorTask = workspace.researchTasks.find((t) => t.id === "r-competitors");

  if (workspace.live) {
    return (
      <ComingNext title="Customer and market research come next">
        <p>
          <b className="font-semibold text-ink">Quantitative evidence tells us what is happening. Customer research explains why.</b> Here
          Veyra will group support tickets and feedback into themes, prepare interview guides, and search the web for competitor and market
          context — kept separate from your own data and labelled by quality.
        </p>
        <p>For now, upload exports of feedback or support tickets as CSV on the Evidence tab and they&rsquo;ll be included in the analysis.</p>
      </ComingNext>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <p className="rounded-xl bg-canvas px-4 py-3 text-[13px] text-ink-muted">
        <b className="font-semibold text-ink">Quantitative evidence tells us what is happening. Customer research explains why.</b> Veyra
        uses the customer tools that fit this investigation, and says why it&rsquo;s leaving the others out.
      </p>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
          <Users className="h-4 w-4 text-brand-600" /> Customer segments
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {customers.segments.map((s) => (
            <div key={s.name} className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <p className="text-[14px] font-semibold">{s.name}</p>
              <p className="mt-0.5 text-[13px] text-ink-muted">{s.description}</p>
              <p className="mt-2 text-xs font-medium text-ink">{s.metric}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <MessagesSquare className="h-4 w-4 text-brand-600" /> Feedback themes
          </h2>
          {customers.themes.length === 0 && (
            <Button type="button" size="sm" variant="secondary" onClick={analyzeFeedback} disabled={running.feedback}>
              {running.feedback ? <Spinner /> : <MessagesSquare className="h-3.5 w-3.5" />}
              {running.feedback ? "Analysing…" : "Analyze Existing Feedback"}
            </Button>
          )}
        </div>
        {customers.themes.length ? (
          <ul className="space-y-2">
            {customers.themes.map((t) => (
              <li key={t.theme} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-medium">{t.theme}</p>
                  <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">{t.mentions} mentions</span>
                </div>
                <p className="mt-1 text-[13px] italic text-ink-subtle">{t.example}</p>
              </li>
            ))}
            <li className="text-xs text-ink-faint">From Support and Customer Feedback · 186 tickets and 412 comments</li>
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-center text-[13px] text-ink-subtle">
            Support tickets and in-app feedback are connected but haven&rsquo;t been grouped into themes yet.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-[15px] font-semibold">Customer understanding tools</h2>
        <p className="mb-3 text-xs text-ink-subtle">Tools, not stages. Veyra recommends only what the evidence calls for.</p>
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {customers.tools.map((t) => (
            <li
              key={t.id}
              className={cn(
                "rounded-xl border p-4",
                t.status === "not-relevant" ? "border-dashed border-line-strong bg-canvas/50" : "border-line bg-surface shadow-card",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-[14px] font-semibold", t.status === "not-relevant" && "text-ink-muted")}>{t.name}</p>
                <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium", toolStatus[t.status].className)}>{toolStatus[t.status].label}</span>
              </div>
              <p className="mt-1 text-[13px] text-ink-muted">{t.reason}</p>
              {t.id === "t-interviews" && (
                <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={openInterviewGuide}>
                  Generate Interview Guide
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <Globe2 className="h-4 w-4 text-uncertain-600" /> Market &amp; competitor context
            </h2>
            <p className="mt-0.5 text-xs text-ink-subtle">External research is an evidence source, kept separate from your own data and labelled by quality.</p>
          </div>
          <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-subtle">{market.status === "done" ? "Done" : market.status === "in-progress" ? "In progress" : "Not started"}</span>
        </div>
        <p className="rounded-xl border border-line bg-surface p-4 text-[13.5px] text-ink shadow-card">{market.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => runResearch("r-competitors")}
            disabled={running["r-competitors"] || competitorTask?.status === "done"}
          >
            {running["r-competitors"] ? <Spinner /> : <Search className="h-3.5 w-3.5" />} Research Competitors
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled title="Available with the research engine">
            <BookOpen className="h-3.5 w-3.5" /> Research Market
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled title="Available with the research engine">
            <Scale className="h-3.5 w-3.5" /> Compare Alternatives
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={openAddEvidence}>
            <Upload className="h-3.5 w-3.5" /> Upload Existing Research
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">Preview: competitor research is simulated; market research and comparisons arrive with the research engine.</p>
        {external.length > 0 && (
          <ul className="mt-4 space-y-2">
            {external.map((e) => (
              <li key={e.id} className="rounded-xl border border-l-[3px] border-line border-l-uncertain-600 bg-surface p-2 shadow-card">
                <EvidenceCard item={e} onSelect={() => openDetail({ type: "evidence", id: e.id })} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
