import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BriefDocument } from "@/components/brief/BriefDocument";
import { createClient } from "@/lib/supabase/server";
import type { DecisionBrief, InvestigationDecision } from "@/lib/types";

/** A Decision Brief shared by link: read-only, and nothing else from the investigation. */

export const metadata: Metadata = { title: "Decision Brief", robots: { index: false, follow: false } };

type Shared = {
  content: DecisionBrief;
  createdAt: string;
  decision: (Pick<InvestigationDecision, "summary" | "outcome" | "owner" | "createdAt" | "successMeasure" | "result" | "warnings"> & { reviewDate: string | null }) | null;
};

export default async function SharedBriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_brief", { token });
  const shared = data as unknown as Shared | null;
  if (!shared?.content) notFound();
  const decision = shared.decision ? { ...shared.decision, reviewDate: shared.decision.reviewDate ?? undefined } : undefined;
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl rounded-xl border border-line bg-surface p-6 shadow-card sm:p-10">
        <BriefDocument brief={shared.content} decision={decision} />
      </div>
      <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-ink-faint">Shared read-only from Veyra.</p>
    </main>
  );
}
