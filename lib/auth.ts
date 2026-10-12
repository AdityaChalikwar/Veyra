import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { Company, CompanySize, Industry, User } from "@/lib/types";

/**
 * Who is signed in, and which workspace they belong to.
 *
 * Every signed-in page and server action goes through these helpers. They are
 * the real access check (proxy.ts only refreshes the session cookie), and the
 * database's Row Level Security backs them up. `cache` makes repeated calls
 * within one request free.
 */

export type SignInMethod = "email" | "google";

export type Session = { user: User; method: SignInMethod };

export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile, error } = await supabase.from("profiles").select("full_name, email").eq("id", claims.sub).maybeSingle();
  // Every account has a profile, so none means the account was deleted while
  // the browser still held its login: treat the visitor as signed out.
  if (!error && !profile) return null;
  const email = profile?.email || (typeof claims.email === "string" ? claims.email : "");
  const name = profile?.full_name?.trim() || email.split("@")[0] || "You";
  const provider = (claims.app_metadata as { provider?: string } | undefined)?.provider;

  return {
    user: { id: claims.sub, name, email, avatarInitial: name.charAt(0).toUpperCase() },
    method: provider === "google" ? "google" : "email",
  };
});

/** The signed-in user's workspace, or null before it has been created. */
export const getWorkspace = cache(async (): Promise<Company | null> => {
  const session = await getSession();
  if (!session) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("workspaces (id, name, description, industry, size)")
    .eq("user_id", session.user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  const ws = data?.workspaces;
  if (!ws) return null;
  return {
    id: ws.id,
    name: ws.name,
    description: ws.description,
    // The database only accepts the values in lib/options.ts.
    industry: ws.industry as Industry,
    size: ws.size as CompanySize,
  };
});

/** For signed-in pages: sends visitors to log in. */
export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(routes.login);
  return session;
}

/**
 * The signed-in user's workspace, created on first use. Veyra asks for no
 * business details at sign-up: the workspace is named after the person, and
 * company details and business context can be added later if they want.
 */
const ensureWorkspace = cache(async (session: Session): Promise<Company | null> => {
  const existing = await getWorkspace();
  if (existing) return existing;
  const first = session.user.name.split(" ")[0] || "My";
  const name = `${first}'s workspace`;
  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("save_workspace", { p_name: name, p_description: "", p_industry: "Other", p_size: "1–10" });
  if (error || !id) return null;
  return { id, name, description: "", industry: "Other", size: "1–10" };
});

/** For pages inside the app and their actions: a signed-in user with a workspace. */
export async function requireWorkspace(): Promise<{ session: Session; company: Company }> {
  const session = await requireUser();
  const company = await ensureWorkspace(session);
  if (!company) throw new Error("Couldn't set up your workspace. Reload the page to try again.");
  return { session, company };
}

/** Where a signed-in user should land. */
export async function homeFor(): Promise<string> {
  return routes.dashboard;
}
