"use client";

import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { processUpload, registerUpload } from "@/app/(app)/investigations/actions";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 20 * 1024 * 1024;

type Step = { name: string; state: "uploading" | "reading" };

/**
 * Upload a CSV: the file goes straight from the browser to private storage,
 * then the server reads it and turns it into evidence.
 */
export function DataUploader({ investigationId }: { investigationId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    setError(null);
    if (!/\.csv$/i.test(file.name)) return setError("Veyra reads CSV files for now. In Excel or Google Sheets, use File → Download / Save as → CSV.");
    if (file.size > MAX_BYTES) return setError("That file is over 20 MB. Upload a smaller export, such as fewer months or fewer columns.");
    if (file.size === 0) return setError("That file is empty.");

    try {
      setStep({ name: file.name, state: "uploading" });
      const registered = await registerUpload(investigationId, { name: file.name, size: file.size });
      if ("error" in registered) throw new Error(registered.error);

      const { error: uploadError } = await createClient()
        .storage.from("uploads")
        .upload(registered.path, await file.arrayBuffer(), { contentType: "text/csv", upsert: false });
      // If the upload itself failed, processing records the failure on the file.
      if (!uploadError) setStep({ name: file.name, state: "reading" });

      const processed = await processUpload(registered.fileId);
      if ("error" in processed) setError(`${file.name}: ${processed.error}`);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't reach Veyra. Check your connection and try again.");
    }
    setStep(null);
    router.refresh();
  }

  async function uploadAll(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) await upload(file);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <button
        type="button"
        disabled={step !== null}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void uploadAll(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
          dragging ? "border-brand-500 bg-brand-50" : "border-line-strong bg-canvas/50 hover:border-brand-300 hover:bg-brand-50/40",
          step && "cursor-wait",
        )}
      >
        {step ? (
          <>
            <Spinner className="h-5 w-5 text-brand-600" />
            <span className="text-[14px] font-medium">
              {step.state === "uploading" ? `Uploading ${step.name}…` : `Reading ${step.name}…`}
            </span>
            <span className="text-xs text-ink-subtle">
              {step.state === "uploading" ? "Sending it to secure storage." : "Checking columns, dates, totals and anything that looks wrong."}
            </span>
          </>
        ) : (
          <>
            <FileUp className="h-6 w-6 text-brand-600" />
            <span className="text-[14px] font-medium">Upload a CSV</span>
            <span className="text-xs text-ink-subtle">Drop it here or click to choose · up to 20 MB · one header row</span>
          </>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        multiple
        className="sr-only"
        aria-label="CSV file"
        onChange={(e) => void uploadAll(e.target.files)}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
