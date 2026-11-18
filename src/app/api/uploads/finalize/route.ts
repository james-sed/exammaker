import { z } from "zod";
import { auth } from "@/lib/auth";
import { finalizeUpload } from "@/features/uploads/services/finalizeUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  pathname: z.string().trim().min(1).max(1024),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { error: "Please sign in to finish the upload." },
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
      { error: "That upload request isn't valid." },
      { status: 400 }
    );
  }

  try {
    const outcome = await finalizeUpload({
      ownerId: session.user.id,
      pathname: parsed.data.pathname,
    });

    if (outcome.kind === "not_found") {
      return Response.json(
        { error: "Upload not found." },
        { status: 404 }
      );
    }

    return Response.json(outcome.result);
  } catch (error) {
    console.error("Failed to finalize upload:", error);

    return Response.json(
      {
        error:
          "We couldn't finish reading that file. It was marked as failed; try uploading it again.",
      },
      { status: 500 }
    );
  }
}
