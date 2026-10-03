"use client";

import { ArrowLeft, ArrowRight, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { signInWithEmail, signInWithGoogle, signUpWithEmail, type AuthResult } from "@/app/auth/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/options";
import { routes } from "@/lib/routes";
import { GoogleIcon } from "./GoogleIcon";

type Mode = "login" | "signup";
type Pending = "google" | "email" | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const urlErrors: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Log in, or sign up again to get a new one.",
};

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

  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "login" ? "login" : "signup");
  const [showEmail, setShowEmail] = useState(searchParams.has("error"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(urlErrors[searchParams.get("error") ?? ""] ?? null);
  const [pending, setPending] = useState<Pending>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const text = copy[mode];

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    router.replace(next === "login" ? routes.login : routes.signup, { scroll: false });
  }

  function handle(result: AuthResult) {
    if ("redirectTo" in result) {
      router.push(result.redirectTo);
      router.refresh();
      return;
    }
    setPending(null);
    if ("checkEmail" in result) setSentTo(result.checkEmail);
    else setError(result.error);
  }

  async function handleGoogle() {
    setError(null);
    setPending("google");
    const result = await signInWithGoogle();
    if ("url" in result) {
      window.location.assign(result.url);
      return;
    }
    setPending(null);
    setError(result.error);
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid work email address.");
      return;
    }
    if (mode === "signup" && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
      return;
    }
    setError(null);
    setPending("email");
    try {
      handle(mode === "signup" ? await signUpWithEmail({ name, email, password }) : await signInWithEmail({ email, password }));
    } catch {
      setPending(null);
      setError("Couldn't reach Veyra. Check your connection and try again.");
    }
  }

  if (sentTo) {
    return (
      <div className="flex min-h-screen flex-col px-4 py-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <MailCheck className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-ink-muted">
            We sent a confirmation link to <span className="font-medium text-ink">{sentTo}</span>. Open it on this device to finish
            creating your account.
          </p>
          <p className="mt-4 text-xs text-ink-subtle">Nothing arrived after a few minutes? Check your spam folder.</p>
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              switchMode("login");
            }}
            className="mt-6 self-start text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Back to log in
          </button>
        </div>
      </div>
    );
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

              <Field label="Password" htmlFor="auth-password">
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? `At least ${MIN_PASSWORD_LENGTH} characters` : ""}
                  className={inputClass}
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
          {error && !showEmail && (
            <p role="alert" className="text-xs text-danger-600">
              {error}
            </p>
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
      </div>
    </div>
  );
}
