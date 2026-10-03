"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/options";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export type AuthResult = { error: string } | { redirectTo: string } | { checkEmail: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Base URL that emails and OAuth send people back to. */
async function siteUrl() {
  const origin = (await headers()).get("origin");
  return origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function signUpWithEmail(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid work email address." };
  if (input.password.length < MIN_PASSWORD_LENGTH) return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.` };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { full_name: input.name.trim() },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(routes.onboarding)}`,
    },
  });
  if (error) return { error: friendlyError(error) };
  // No session means Supabase sent a confirmation email first.
  if (!data.session) return { checkEmail: email };
  return { redirectTo: routes.onboarding };
}

export async function signInWithEmail(input: { email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid work email address." };
  if (!input.password) return { error: "Enter your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: input.password });
  if (error) return { error: friendlyError(error) };
  return { redirectTo: await homeFor() };
}

/** Starts Google sign-in. Returns the Google URL to send the browser to. */
export async function signInWithGoogle(): Promise<{ url: string } | { error: string }> {
  if (!(await googleEnabled())) return { error: "Google sign-in isn't switched on yet. Use email for now." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteUrl()}/auth/callback` },
  });
  if (error || !data.url) return { error: "Couldn't start Google sign-in. Try again, or use email." };
  return { url: data.url };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(routes.home);
}

/** Whether Google is enabled for this Supabase project (Auth → Providers). */
async function googleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      next: { revalidate: 300 },
    });
    if (!res.ok) return false;
    const settings = (await res.json()) as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}

function friendlyError(error: { code?: string; message: string; status?: number }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match. Check them and try again.";
    case "email_not_confirmed":
      return "Confirm your email first — use the link we sent you.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Log in instead.";
    case "weak_password":
      return "Choose a stronger password — longer, and not a common one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    case "signup_disabled":
      return "New sign-ups are switched off for now.";
  }
  return "Something went wrong. Try again in a moment.";
}
