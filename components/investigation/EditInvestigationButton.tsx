"use client";

import { Check, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateInvestigation, type InvestigationEdit } from "@/app/(app)/investigations/actions";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { OUTCOMES, TRIGGERS } from "@/lib/options";

/** Edit an investigation's title, problem, objective, triggers and outcomes. */
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
          <ChoiceList
            legend="What triggered it"
            options={TRIGGERS}
            selected={form.triggers}
            onToggle={(v) => set("triggers", toggle(form.triggers, v))}
          />
          <ChoiceList
            legend="Outcome wanted"
            options={OUTCOMES}
            selected={form.outcomes}
            onToggle={(v) => set("outcomes", toggle(form.outcomes, v))}
          />
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

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

/** A compact set of tick-boxes; any number can be chosen. */
function ChoiceList<T extends string>({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: readonly { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[13px] font-medium text-ink">
        {legend} <span className="font-normal text-ink-subtle">(choose all that apply)</span>
      </legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(o.value)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[13px] transition-colors",
                on ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {on && <Check className="h-3.5 w-3.5" />} {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
