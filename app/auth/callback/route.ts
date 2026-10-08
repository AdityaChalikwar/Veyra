import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { homeFor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Where links in sign-in emails and Google sign-in return to. Exchanges the
 * one-time code for a session cookie, then sends the user on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  if (!ok) return NextResponse.redirect(`${origin}/auth?mode=login&error=link`);
  return NextResponse.redirect(`${origin}${safeNext(searchParams.get("next")) ?? (await homeFor())}`);
}

/** Only allow redirects to paths on this site. */
function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
