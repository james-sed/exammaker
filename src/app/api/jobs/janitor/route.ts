import { timingSafeEqual } from "crypto";
import { runJanitor } from "@/features/uploads/services/janitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function secretsMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. If the secret is not
 * configured the route refuses to run rather than exposing the janitor.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  const authorization = request.headers.get("authorization");

  if (
    !secretsMatch(authorization, `Bearer ${secret}`) &&
    !secretsMatch(authorization, secret)
  ) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runJanitor();
    return Response.json({ ok: true, result });
  } catch (error) {
    console.error("Janitor run failed:", error);

    return Response.json(
      { ok: false, error: "The janitor run failed." },
      { status: 500 }
    );
  }
}
