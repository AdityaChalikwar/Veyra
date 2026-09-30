"use client";

import { FileUp, Link2, StickyNote, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { useWorkspace } from "@/components/investigation/workspace-context";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import type { EvidenceCategory, EvidenceFormat } from "@/lib/types";

type Mode = "file" | "link" | "note";

const modes: { id: Mode; label: string; icon: typeof FileUp }[] = [
  { id: "file", label: "Upload file", icon: FileUp },
  { id: "link", label: "Add link", icon: Link2 },
  { id: "note", label: "Write note", icon: StickyNote },
];

function formatFromName(name: string): EvidenceFormat {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "doc";
  return "text";
}

/** Mock "Add Evidence" flow: nothing is uploaded; the item is added to this investigation locally. */
export function AddEvidenceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addEvidence } = useWorkspace();
  const [mode, setMode] = useState<Mode>("file");
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState<EvidenceCategory>("uploaded-research");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function reset() {
    setFileName("");
    setTitle("");
    setUrl("");
    setNote("");
    setCategory("uploaded-research");
  }

  function close() {
    reset();
    onClose();
  }

  const canAdd = mode === "file" ? !!fileName : mode === "link" ? !!url.trim() : !!title.trim() && !!note.trim();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdd) return;
    if (mode === "file") {
      addEvidence({ name: fileName, category, source: "Uploaded by you", format: formatFromName(fileName) });
    } else if (mode === "link") {
      addEvidence({ name: title.trim() || url.trim(), category: "notes", source: "Link", format: "link", url: url.trim() });
    } else {
      addEvidence({ name: title.trim(), category: "notes", source: "Note", format: "text", description: note.trim() });
    }
    close();
  }

  return (
    <Modal open={open} onClose={close} title="Add Evidence" description="Give Veyra more to work with. Each item is linked to this investigation.">
      <form onSubmit={submit} className="space-y-5">
        <div role="tablist" aria-label="Evidence type" className="grid grid-cols-3 gap-1 rounded-lg bg-canvas p-1">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                "flex h-9 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium",
                mode === id ? "bg-surface text-ink shadow-card" : "text-ink-subtle hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {mode === "file" && (
          <>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center rounded-xl border border-dashed border-line-strong bg-canvas/60 px-4 py-8 text-center hover:border-brand-300 hover:bg-brand-50/40"
            >
              <UploadCloud className="h-7 w-7 text-ink-faint" />
              <span className="mt-2 text-sm font-medium">{fileName || "Choose a file"}</span>
              <span className="mt-0.5 text-xs text-ink-subtle">CSV, Excel, PDF or documents</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              className="sr-only"
              accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.txt"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              aria-label="File"
            />
            <Field label="What kind of evidence is it?" htmlFor="ev-category">
              <select id="ev-category" value={category} onChange={(e) => setCategory(e.target.value as EvidenceCategory)} className={inputClass}>
                <option value="company-data">Company data (export from your systems)</option>
                <option value="customer-evidence">Customer evidence (interviews, surveys, feedback)</option>
                <option value="uploaded-research">Research report</option>
              </select>
            </Field>
          </>
        )}

        {mode === "link" && (
          <>
            <Field label="Link" htmlFor="ev-url">
              <input id="ev-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className={inputClass} autoFocus />
            </Field>
            <Field label="Title (optional)" htmlFor="ev-link-title">
              <input id="ev-link-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q3 marketing plan" className={inputClass} />
            </Field>
          </>
        )}

        {mode === "note" && (
          <>
            <Field label="Title" htmlFor="ev-note-title">
              <input id="ev-note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What the sales team is hearing" className={inputClass} autoFocus />
            </Field>
            <Field label="Note" htmlFor="ev-note">
              <textarea id="ev-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} className={textareaClass} />
            </Field>
          </>
        )}

        <p className="text-xs text-ink-faint">Veyra analyses new evidence and suggests changes for you to review. Preview build: nothing leaves your browser.</p>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canAdd}>
            Add to investigation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
