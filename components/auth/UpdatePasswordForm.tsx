"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePassword } from "@/app/auth/actions";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { MIN_PASSWORD_LENGTH } from "@/lib/options";

export function UpdatePasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
    if (password !== confirm) return setError("The two passwords don't match.");
    setSaving(true);
    setError(null);
    try {
      const result = await updatePassword({ password });
      if ("redirectTo" in result) {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }
      setError("error" in result ? result.error : "Something went wrong. Try again in a moment.");
    } catch {
      setError("Couldn't reach Veyra. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white px-4 py-8 sm:px-6">
      <Logo />
      <form onSubmit={submit} noValidate className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center space-y-4 py-10">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
          <p className="mt-1 text-sm text-ink-subtle">For {email}</p>
        </div>
        <Field label="New password" htmlFor="new-password">
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            className={inputClass}
          />
        </Field>
        <Field label="Repeat new password" htmlFor="confirm-password">
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </Field>
        {error && (
          <p role="alert" className="text-xs text-danger-600">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? <Spinner /> : null} Save password {!saving && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
