import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import {
  ALLOWED_CONTENT_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/features/uploads/constants";
import {
  ensureSourceFileForUpload,
  UploadTokenError,
} from "@/features/uploads/services/issueUploadToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Mints a short-lived client token. The SourceFile row is created here, before
 * the binary moves, and the client-chosen pathname is validated against the
 * signed-in user.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("Please sign in to upload a file.", 401);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return jsonError(
      "Uploads aren't configured yet. Add BLOB_READ_WRITE_TOKEN to the environment.",
      503
    );
  }

  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return jsonError("That upload request isn't valid.", 400);
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await ensureSourceFileForUpload({
          userId: session.user.id,
          pathname,
          clientPayload,
        });

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof UploadTokenError) {
      return jsonError(error.message, 400);
    }

    console.error("Failed to issue upload token:", error);

    return jsonError(
      "We couldn't start the upload. Please try again.",
      500
    );
  }
}
