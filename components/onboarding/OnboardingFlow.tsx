"use client";

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Cpu,
  Factory,
  HeartPulse,
  Landmark,
  MoreHorizontal,
  ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { saveCompany } from "@/app/onboarding/actions";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/options";
import { routes } from "@/lib/routes";
import type { Company, CompanySize, Industry } from "@/lib/types";
import { OptionGrid, type Option } from "./OptionGrid";
import { ProfilePreview } from "./ProfilePreview";
import { StepIndicator } from "./StepIndicator";

const industryIcons: Record<Industry, Option<Industry>["icon"]> = {
  Technology: Cpu,
  Consumer: ShoppingBag,
  "Financial Services": Landmark,
  Healthcare: HeartPulse,
  Manufacturing: Factory,
  "Professional Services": Briefcase,
  Other: MoreHorizontal,
};

const industryOptions = INDUSTRIES.map((value) => ({ value, icon: industryIcons[value] }));
const sizeOptions = COMPANY_SIZES.map(({ value, label }) => ({ value, label }));

const STEPS = [
  { title: "Tell us about your company", hint: "Just the basics — a sentence is plenty." },
  { title: "Which industry are you in?", hint: "Helps Veyra choose relevant benchmarks and frameworks." },
  { title: "How big is your company?", hint: "Number of employees." },
] as const;

export function OnboardingFlow({ firstName, initial }: { firstName?: string; initial: Company | null }) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [industry, setIndustry] = useState<Industry | null>(initial?.industry ?? null);
  const [size, setSize] = useState<CompanySize | null>(initial?.size ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLast = step === STEPS.length - 1;
  const canContinue = [
    name.trim().length > 0 && description.trim().length > 0,
    industry !== null,
    size !== null,
  ][step];

  async function next(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canContinue || saving) return;
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await saveCompany({ name, description, industry: industry!, size: size! });
      if ("error" in result) {
        setError(result.error);
        setSaving(false);
        return;
      }
      router.push(routes.dashboard);
      router.refresh();
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo href={routes.home} />
          <StepIndicator step={step + 1} total={STEPS.length} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <p className="text-sm text-ink-subtle">{firstName ? `Welcome, ${firstName}.` : "Welcome."}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">Let&rsquo;s understand your business.</h1>
        <p className="mt-2 text-ink-muted">This helps Veyra make your investigations more relevant.</p>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form onSubmit={next} className="min-w-0">
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" aria-labelledby="step-title">
              <h2 id="step-title" className="text-lg font-semibold">
                {STEPS[step].title}
              </h2>
              <p className="mt-1 text-sm text-ink-subtle">{STEPS[step].hint}</p>

              <div className="mt-5">
                {step === 0 && (
                  <div className="space-y-4">
                    <Field label="Company name" htmlFor="company-name">
                      <input
                        id="company-name"
                        autoFocus
                        autoComplete="organization"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Acme"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="What does your company do?" htmlFor="company-description">
                      <input
                        id="company-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Consumer subscription app"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                )}
                {step === 1 && (
                  <OptionGrid
                    ariaLabel="Industry"
                    options={industryOptions}
                    selected={industry ? [industry] : []}
                    onToggle={setIndustry}
                  />
                )}
                {step === 2 && (
                  <OptionGrid
                    ariaLabel="Company size"
                    options={sizeOptions}
                    selected={size ? [size] : []}
                    onToggle={setSize}
                  />
                )}
                </div>

              {error && (
                <p role="alert" className="mt-4 text-sm text-danger-600">
                  {error}
                </p>
              )}

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
                {step > 0 ? (
                  <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} disabled={saving}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                ) : (
                  <span />
                )}
                <Button type="submit" disabled={!canContinue || saving}>
                  {saving && <Spinner />}
                  {isLast ? "Enter Veyra" : "Continue"}
                  {!saving && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </section>
          </form>

          <aside className="hidden lg:block">
            <ProfilePreview
              rows={[
                { label: "Company", value: name.trim(), active: step === 0 },
                { label: "What you do", value: description.trim(), active: step === 0 },
                { label: "Industry", value: industry ?? undefined, active: step === 1 },
                { label: "Size", value: size ? `${size} employees` : undefined, active: step === 2 },
              ]}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
