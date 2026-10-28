"use client";

import { ArrowRight, CheckCircle2, Compass, Gavel, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reopenInvestigation } from "@/app/(app)/investigations/decision-actions";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { nextAction, type NextAction } from "@/lib/investigation/guide";
import { routes } from "@/lib/routes";
import { useWorkspace } from "./workspace-context";

/**
 * One line under the progress stages saying what moves the investigation
 * forward right now, with a link to where that happens.
 */
export function NextActionBar() {
  const { workspace } = useWorkspace();
  return <LiveNext action={nextAction(workspace)} id={workspace.investigation.id} />;
}

const TONE = {
  next: { box: "border-brand-200 bg-brand-50/60", text: "text-brand-700", Icon: Compass },
  working: { box: "border-brand-200 bg-brand-50/60", text: "text-brand-700", Icon: Loader2 },
  ready: { box: "border-confirmed-200 bg-confirmed-50", text: "text-confirmed-600", Icon: Gavel },
  done: { box: "border-confirmed-200 bg-confirmed-50", text: "text-confirmed-600", Icon: CheckCircle2 },
} as const;

/** The team's own investigation: what moves it forward now, and when it is ready to decide. */
function LiveNext({ action: a, id }: { action: NextAction; id: string }) {
  const t = TONE[a.tone];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function reopen() {
    setBusy(true);
    setError(null);
    const r = await reopenInvestigation(id).catch(() => ({ error: "Couldn't reach Veyra. Check your connection and try again." }));
    if ("error" in r) setError(r.error);
    else router.refresh();
    setBusy(false);
  }
  return (
    <div className={cn("mt-2 flex flex-col gap-2 rounded-lg border px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between", t.box)}>
      <p className={cn("flex items-start gap-2 text-[13px]", t.text)}>
        <t.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", a.tone === "working" && "animate-spin")} />
        <span>
          <b className="font-semibold">{a.label}</b> {a.text}
          {error && <span className="mt-0.5 block text-danger-600">{error}</span>}
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {a.tone === "done" && (
          <button type="button" disabled={busy} onClick={reopen} className="text-[13px] font-medium text-ink-subtle hover:text-ink disabled:opacity-50">
            {busy ? "Reopening…" : "Reopen"}
          </button>
        )}
        {a.alt && (
          <Link href={routes.investigation(id, a.alt.tab)} className="text-[13px] font-medium text-ink-subtle hover:text-ink">
            {a.alt.cta}
          </Link>
        )}
        <Link href={routes.investigation(id, a.tab)} className={buttonClass({ size: "sm", variant: a.tone === "ready" ? "primary" : "secondary", className: "shrink-0" })}>
          {a.cta} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
