"use client";

import { Plug } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { connectDemoErp } from "@/app/(app)/data-sources/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { routes } from "@/lib/routes";

/** Connects the Demo ERP, then opens its step-by-step set-up. */
export function ConnectDemoErpButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const r = await connectDemoErp();
      if ("error" in r) {
        setError(r.error);
        setBusy(false);
      } else router.push(routes.dataSource(r.id));
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={connect} disabled={busy}>
        {busy ? <Spinner /> : <Plug className="h-4 w-4" />} Set it up step by step
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
