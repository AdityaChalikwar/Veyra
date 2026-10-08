"use client";

import { Building2, Check, Flag, Gauge, Pencil, Target, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveBusinessContext } from "@/app/(app)/context/actions";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { BusinessContext } from "@/lib/types";

const toLines = (items: string[]) => items.join("\n");
const fromLines = (text: string) => text.split("\n");

/** Shows the business context, and edits it in place. */
export function BusinessContextEditor({ context }: { context: BusinessContext }) {
  const router = useRouter();
  const empty = !context.product && !context.businessModel && !context.targetCustomers && !context.goals.length;
  const [editing, setEditing] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    product: context.product,
    businessModel: context.businessModel,
    targetCustomers: context.targetCustomers,
    goals: toLines(context.goals),
    priorities: toLines(context.priorities),
    keyMetrics: toLines(context.keyMetrics),
  });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await saveBusinessContext({
        product: form.product,
        businessModel: form.businessModel,
        targetCustomers: form.targetCustomers,
        goals: fromLines(form.goals),
        priorities: fromLines(form.priorities),
        keyMetrics: fromLines(form.keyMetrics),
      });
      if ("error" in result) setError(result.error);
      else {
        setEditing(false);
        router.refresh();
      }
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
    }
    setSaving(false);
  }

  if (editing) {
    const area = cn(textareaClass, "min-h-[88px]");
    return (
      <form onSubmit={save} className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Building2 className="h-4 w-4 text-brand-600" /> {empty ? "Tell Veyra about your business" : "Edit business context"}
        </h2>
        <p className="mt-1 text-xs text-ink-subtle">A sentence each is plenty. For lists, put one item per line.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Product" htmlFor="ctx-product">
            <input id="ctx-product" value={form.product} onChange={set("product")} placeholder="Commerce platform for mid-market retailers" className={inputClass} />
          </Field>
          <Field label="Business model" htmlFor="ctx-model">
            <input id="ctx-model" value={form.businessModel} onChange={set("businessModel")} placeholder="B2B SaaS, priced per store" className={inputClass} />
          </Field>
          <Field label="Target customers" htmlFor="ctx-customers">
            <input id="ctx-customers" value={form.targetCustomers} onChange={set("targetCustomers")} placeholder="Independent retailers with 1–20 stores" className={inputClass} />
          </Field>
          <span className="hidden md:block" />
          <Field label="Primary business goals" htmlFor="ctx-goals">
            <textarea id="ctx-goals" rows={3} value={form.goals} onChange={set("goals")} placeholder={"Increase retention\nGrow expansion revenue"} className={area} />
          </Field>
          <Field label="Current strategic priorities" htmlFor="ctx-priorities">
            <textarea id="ctx-priorities" rows={3} value={form.priorities} onChange={set("priorities")} placeholder={"Improve onboarding\nExpand into Europe"} className={area} />
          </Field>
          <Field label="Key metrics" htmlFor="ctx-metrics">
            <textarea id="ctx-metrics" rows={3} value={form.keyMetrics} onChange={set("keyMetrics")} placeholder={"Daily active users\nActivation rate"} className={area} />
          </Field>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-danger-600">
            {error}
          </p>
        )}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
          {!empty && (
            <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner /> : <Check className="h-4 w-4" />} Save
          </Button>
        </div>
      </form>
    );
  }

  return (
    <>
      <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Building2 className="h-4 w-4 text-brand-600" /> Product & model
          </h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Value label="Company" value={context.company} />
          <Value label="Product" value={context.product} />
          <Value label="Business model" value={context.businessModel} />
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ListCard icon={Users} title="Target customers" items={context.targetCustomers ? [context.targetCustomers] : []} />
        <ListCard icon={Target} title="Primary business goals" items={context.goals} />
        <ListCard icon={Flag} title="Current strategic priorities" items={context.priorities} />
        <ListCard icon={Gauge} title="Key metrics" items={context.keyMetrics} />
      </div>
    </>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className={cn("mt-0.5 text-sm", value ? "text-ink" : "text-ink-faint")}>{value || "Not set yet"}</dd>
    </div>
  );
}

function ListCard({ icon: Icon, title, items }: { icon: typeof Users; title: string; items: string[] }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
        <Icon className="h-4 w-4 text-brand-600" /> {title}
      </h2>
      {items.length ? (
        <ul className="mt-3 space-y-1.5">
          {items.map((i) => (
            <li key={i} className="text-[14px] text-ink">
              {i}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-ink-faint">Not set yet</p>
      )}
    </section>
  );
}
