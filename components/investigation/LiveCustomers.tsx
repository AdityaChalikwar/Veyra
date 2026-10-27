"use client";

import { ExternalLink, Globe, MessageSquareQuote, Users } from "lucide-react";
import Link from "next/link";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { routes } from "@/lib/routes";
import type { LiveInvestigation } from "@/lib/types";
import type { RunResult } from "@/lib/validation-run/types";
import { useWorkspace } from "./workspace-context";

const CUSTOMER_METHODS = new Set(["customer-interviews", "survey", "feedback-analysis", "usability-testing"]);

/**
 * Customers & Market for the team's own investigation: who is affected, what
 * customers say (text Veyra read during validation, and customer research the
 * team finished), and outside context Veyra found on the web — each with its source.
 */
export function LiveCustomers({ live }: { live: LiveInvestigation }) {
  const { workspace } = useWorkspace();
  const id = workspace.investigation.id;
  const record = live.record;
  const results = record.validations.flatMap((v) => (v.run?.phase === "completed" ? v.run.results.map((r) => ({ r, about: v.hypothesisTitle || v.hypothesisStatement })) : []));
  const texts = results.filter((x): x is { r: Extract<RunResult, { kind: "text" }>; about: string } => x.r.kind === "text");
  const web = results.filter((x): x is { r: Extract<RunResult, { kind: "web" }>; about: string } => x.r.kind === "web");
  const research = record.researchTasks.filter((t) => CUSTOMER_METHODS.has(t.method) && t.status === "done" && t.outcome.trim());
  const affected = record.problemDefinition?.affected;

  return (
    <div className="mt-6 max-w-4xl space-y-6">
      <p className="rounded-xl bg-canvas px-4 py-3 text-[13px] text-ink-muted">
        <b className="font-semibold text-ink">Your data shows what is happening; customers explain why.</b> This page gathers what this
        investigation has learned about customers and the outside world, each with where it came from.
      </p>

      <Section icon={Users} title="Who is affected">
        {affected ? (
          <p className="text-[14px] text-ink">{affected}</p>
        ) : (
          <EmptyNote>
            Defined with the problem.{" "}
            <Link href={routes.investigation(id, "problem")} className="font-medium text-brand-600">
              Go to Problem
            </Link>
          </EmptyNote>
        )}
      </Section>

      <Section icon={MessageSquareQuote} title="What customers are saying">
        {texts.length === 0 && research.length === 0 ? (
          <EmptyNote>
            Nothing yet. Upload support tickets, reviews or survey answers as CSV, and Veyra reads them when it validates a hypothesis. Customer
            research you finish in the Research tab shows here too.
          </EmptyNote>
        ) : (
          <ul className="space-y-3">
            {texts.map(({ r, about }) => {
              const total = r.counts.reduce((n, c) => n + c.count, 0) || 1;
              return (
                <li key={`${about}-${r.id}`} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                  <p className="text-[13.5px] font-semibold text-ink">{r.question}</p>
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    Veyra read {r.read} of {r.total} texts in {r.dataset} · while validating &ldquo;{about}&rdquo;
                  </p>
                  <ul className="mt-2 space-y-1">
                    {r.counts.map((c) => (
                      <li key={c.label} className="flex items-center gap-2 text-[12.5px]">
                        <span className="w-40 shrink-0 truncate text-ink-muted">{c.label}</span>
                        <span className="h-2 rounded bg-brand-500" style={{ width: `${Math.max(4, (c.count / total) * 240)}px` }} />
                        <span className="text-ink-subtle">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                  {r.examples.map((e) => (
                    <p key={e} className="mt-2 border-l-2 border-line pl-2 text-xs italic text-ink-muted">
                      &ldquo;{e}&rdquo;
                    </p>
                  ))}
                </li>
              );
            })}
            {research.map((t) => (
              <li key={t.id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                <p className="text-[13.5px] font-semibold text-ink">{t.title}</p>
                <p className="mt-0.5 text-xs text-ink-subtle">Research by the team</p>
                <p className="mt-1.5 text-[13px] text-ink">{t.outcome}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={Globe} title="Outside context">
        {web.length === 0 ? (
          <EmptyNote>Veyra searches the web for public evidence — release notes, reviews, outages, market news — when it validates a hypothesis. What it finds shows here with its sources.</EmptyNote>
        ) : (
          <ul className="space-y-3">
            {web.map(({ r, about }) => (
              <li key={`${about}-${r.id}`} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                <p className="text-[13px] text-ink">{r.finding}</p>
                <p className="mt-0.5 text-xs text-ink-subtle">While validating &ldquo;{about}&rdquo;</p>
                <ul className="mt-1.5 space-y-0.5">
                  {r.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                        {s.title || s.url} <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Users; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
        <Icon className="h-4 w-4 text-brand-600" /> {title}
      </h2>
      {children}
    </section>
  );
}
