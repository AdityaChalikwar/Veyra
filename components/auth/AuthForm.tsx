"use client";

import { ArrowLeft, ArrowRight, Info, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { signInWithEmail, signInWithGoogle } from "@/lib/data/auth";
import { routes } from "@/lib/routes";
import { appActions, useAppState, type AuthMethod } from "@/lib/store/app-store";
import type { User } from "@/lib/types";
import { GoogleIcon } from "./GoogleIcon";

type Mode = "login" | "signup";
type Pending = AuthMethod | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const copy: Record<Mode, { subheading: string; emailCta: string; switchPrompt: string; switchCta: string }> = {
  signup: {
    subheading: "Create your account to start your first investigation.",
    emailCta: "Create account",
    switchPrompt: "Already have an account?",
    switchCta: "Log in",
  },
  login: {
    subheading: "Log in to pick up where you left off.",
    emailCta: "Log in",
    switchPrompt: "New to Veyra?",
    switchCta: "Sign up",
  },
};

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { onboardingComplete } = useAppState();

  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "login" ? "login" : "signup");
  const [showEmail, setShowEmail] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const text = copy[mode];

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    router.replace(next === "login" ? routes.login : routes.signup, { scroll: false });
  }

  function finish(user: User, method: AuthMethod) {
    appActions.signIn(user, method);
    // New accounts always onboard; returning users skip it once it's done.
    const destination = mode === "login" && onboardingComplete ? routes.dashboard : routes.onboarding;
    router.push(destination);
  }

  async function handleGoogle() {
    setError(null);
    setPending("google");
    finish(await signInWithGoogle(), "google");
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid work email address.");
      return;
    }
    setError(null);
    setPending("email");
    finish(await signInWithEmail({ email, name: mode === "signup" ? name : undefined }), "email");
  }

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between lg:justify-end">
        <Logo className="lg:hidden" />
        <Link href={routes.home} className="text-sm text-ink-subtle hover:text-ink">
          Back to site
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to Veyra</h1>
        <p className="mt-1.5 text-sm text-ink-subtle">{text.subheading}</p>

        <div role="tablist" aria-label="Account" className="mt-6 grid grid-cols-2 rounded-lg bg-line/60 p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                "h-8 rounded-md text-sm font-medium transition-colors",
                mode === m ? "bg-surface text-ink shadow-card" : "text-ink-subtle hover:text-ink",
              )}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleGoogle}
            disabled={pending !== null}
          >
            {pending === "google" ? <Spinner /> : <GoogleIcon className="h-[18px] w-[18px]" />}
            Continue with Google
          </Button>

          {!showEmail ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => setShowEmail(true)}
              disabled={pending !== null}
            >
              <Mail className="h-[18px] w-[18px] text-ink-subtle" />
              Continue with Email
            </Button>
          ) : (
            <form onSubmit={handleEmail} noValidate className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Continue with Email</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmail(false);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-ink-subtle hover:text-ink"
                >
                  <ArrowLeft className="h-3 w-3" /> Other options
                </button>
              </div>

              {mode === "signup" && (
                <Field label="Your name" htmlFor="auth-name">
                  <input
                    id="auth-name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label="Work email" htmlFor="auth-email">
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@acme.com"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "auth-error" : undefined}
                  className={cn(inputClass, error && "border-danger-600 focus:border-danger-600")}
                />
              </Field>

              {error && (
                <p id="auth-error" className="text-xs text-danger-600">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={pending !== null}>
                {pending === "email" ? <Spinner /> : null}
                {text.emailCta}
                {pending !== "email" && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-ink-subtle">
          {text.switchPrompt}{" "}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            {text.switchCta}
          </button>
        </p>

        <p className="mt-8 flex items-start gap-2 rounded-lg bg-canvas px-3 py-2.5 text-xs leading-relaxed text-ink-subtle">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          Preview build: sign-in is simulated and no account is created. Your details stay in this browser.
        </p>
      </div>
    </div>
  );
}
