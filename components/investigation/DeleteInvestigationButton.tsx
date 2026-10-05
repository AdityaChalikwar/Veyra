"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteInvestigation } from "@/app/(app)/investigations/actions";
import { Spinner } from "@/components/ui/Spinner";
import { routes } from "@/lib/routes";

/** Deletes an investigation after confirming. */
export function DeleteInvestigationButton({ investigationId, title, label = "Delete investigation" }: { investigationId: string; title: string; label?: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm(`Delete “${title}”? This removes its questions, answers and plan, and can't be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteInvestigation(investigationId);
      if ("error" in result) {
        setError(result.error);
        setDeleting(false);
        return;
      }
      router.push(routes.investigations);
      router.refresh();
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
      setDeleting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={remove}
        disabled={deleting}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-danger-600 hover:underline disabled:opacity-60"
      >
        {deleting ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />} {label}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
