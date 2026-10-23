import { after } from "next/server";
import { getSession } from "@/lib/auth";
import { advanceRun } from "@/lib/validation-run/engine";
import { kick, originOf } from "@/lib/validation-run/kick";

/** Long enough for the slowest phase (a web search or the judge and its challenge). */
export const maxDuration = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Does the next phase of a validation run after replying, then asks for the
 * phase after that, so a run carries on with the page closed. Runs as the
 * signed-in user whose cookies came with the request.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response(null, { status: 400 });
  if (!(await getSession())) return new Response(null, { status: 401 });
  const origin = originOf(request.headers);
  const cookie = request.headers.get("cookie");
  after(async () => {
    const result = await advanceRun(id);
    if ("more" in result && result.more && origin) await kick(origin, cookie, id);
  });
  return new Response(null, { status: 202 });
}
