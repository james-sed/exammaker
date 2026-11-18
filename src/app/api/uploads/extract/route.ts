import { z } from "zod";
import { auth } from "@/lib/auth";
import { retryExtraction } from "@/features/uploads/services/finalizeUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  sourceFileId: z.string().trim().min(1).max(64),
});

/**
 * Retry route for a failed extraction whose blob still exists. The normal path
 * is finalize; this exists so a transient failure does not force a re-upload.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { error: "Please sign in to retry the extraction." },
      { status: 401 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      {
        error:
          "Uploads aren't configured yet. Add BLOB_READ_WRITE_TOKEN to the environment.",
      },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return Response.json(
      { error: "That extraction request isn't valid." },
      { status: 400 }
    );
  }

  try {
    const outcome = await retryExtraction({
      ownerId: session.user.id,
      sourceFileId: parsed.data.sourceFileId,
    });

    if (outcome.kind === "not_found") {
      return Response.json(
        { error: "Upload not found." },
        { status: 404 }
      );
    }

    return Response.json(outcome.result);
  } catch (error) {
    console.error("Failed to retry extraction:", error);

    return Response.json(
      { error: "We couldn't retry that extraction. Try again." },
      { status: 500 }
    );
  }
}
