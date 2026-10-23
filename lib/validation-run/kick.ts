import "server-only";

/**
 * Keeps a validation run going in the background: asks this app's own advance
 * route to do the next phase, as the same signed-in user. Best effort — if it
 * can't get through, an open Validation tab resumes the run.
 */
export async function kick(origin: string, cookie: string | null, runId: string): Promise<void> {
  try {
    await fetch(`${origin}/api/validation-runs/${runId}/advance`, {
      method: "POST",
      headers: { ...(cookie && { cookie }), "x-veyra-run": "1" },
      cache: "no-store",
    });
  } catch (e) {
    console.error("couldn't continue validation run in the background", e);
  }
}

/** The app's own origin, from the incoming request's headers. */
export function originOf(h: Headers): string | null {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}
