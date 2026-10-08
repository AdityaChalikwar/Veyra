"use client";

import { Check, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateInvestigation, type InvestigationEdit } from "@/app/(app)/investigations/actions";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { OUTCOMES, TRIGGERS } from "@/lib/options";
import type { InvestigationOutcome, InvestigationTrigger } from "@/lib/types";

/** Edit an investigation's title, problem, objective, trigger and outcome. */
export function EditInvestigationButton({ investigationId, initial }: { investigationId: string; initial: InvestigationEdit }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InvestigationEdit>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof InvestigationEdit>(key: K, value: InvestigationEdit[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await updateInvestigation(investigationId, form);
      if ("error" in result) setError(result.error);
      else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
    }
    setSaving(false);
  }

  const select = "h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0"
        onClick={() => {
          setForm(initial);
          setError(null);
          setOpen(true);
        }}
      >
        <Pencil className="h-3.5 w-3.5" /> Edit details
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit investigation" description="Change how this investigation is described. Evidence and answers stay as they are.">
        <form onSubmit={save} className="space-y-4">
          <Field label="Title" htmlFor="edit-title">
            <input id="edit-title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} className={inputClass} />
          </Field>
          <Field label="Problem" htmlFor="edit-problem">
            <textarea id="edit-problem" rows={3} value={form.problem} onChange={(e) => set("problem", e.target.value)} className={textareaClass} />
          </Field>
          <Field label="Objective (optional)" htmlFor="edit-objective">
            <textarea
              id="edit-objective"
              rows={2}
              value={form.objective}
              onChange={(e) => set("objective", e.target.value)}
              placeholder="What do you want to achieve or decide?"
              className={textareaClass}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="What triggered it" htmlFor="edit-trigger">
              <select
                id="edit-trigger"
                value={form.trigger ?? ""}
                onChange={(e) => set("trigger", (e.target.value || null) as InvestigationTrigger | null)}
                className={select}
              >
                <option value="">Not given</option>
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Outcome wanted" htmlFor="edit-outcome">
              <select
                id="edit-outcome"
                value={form.outcome ?? ""}
                onChange={(e) => set("outcome", (e.target.value || null) as InvestigationOutcome | null)}
                className={select}
              >
                <option value="">Not given</option>
                {OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : <Check className="h-4 w-4" />} Save changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
