"use client";

import { PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startFullDemo } from "@/app/(app)/investigations/demo-actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { routes } from "@/lib/routes";

/**
 * Starts the full demo: Northwind Home's demo data, then an investigation with
 * data complete enough to go from problem to decision.
 */
export function FullDemoButton({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const r = await startFullDemo();
      if ("error" in r) {
        setError(r.error);
        setBusy(false);
        return;
      }
      router.push(routes.investigation(r.id, "evidence"));
      router.refresh();
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <Button type="button" variant={variant} onClick={run} disabled={busy}>
        {busy ? <Spinner /> : <PlayCircle className="h-4 w-4" />} {busy ? "Preparing the demo…" : "Try the full demo"}
      </Button>
      {busy && <p className="mt-1.5 text-xs text-ink-subtle">Setting up the demo company and its data — under a minute.</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
