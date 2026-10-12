"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setUpDemo } from "@/app/(app)/data-sources/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DEMO_PROBLEM } from "@/lib/connectors/demo-erp/context";
import { routes } from "@/lib/routes";

/**
 * Sets up the Demo ERP in one go — connect, choose every dataset, accept the
 * suggested mappings, sync — then starts an investigation into its story.
 */
export function TryDemoButton({ label = "Try with demo data" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const r = await setUpDemo();
      if ("error" in r) {
        setError(r.error);
        setBusy(false);
        return;
      }
      router.push(`${routes.newInvestigation}?problem=${encodeURIComponent(DEMO_PROBLEM)}`);
      router.refresh();
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={run} disabled={busy}>
        {busy ? <Spinner /> : <Sparkles className="h-4 w-4" />} {busy ? "Setting up the demo data…" : label}
      </Button>
      {busy && <p className="mt-1.5 text-xs text-ink-subtle">Connecting, mapping, checking and syncing a year of data — about 15 seconds.</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
