import { Prisma } from "@prisma/client";
import { del, head } from "@vercel/blob";
import { db } from "@/lib/db";
import { ACTIVE_HEARTBEAT_MS } from "../constants";
import type {
  FinalizeUploadResult,
  SourceFileSummary,
} from "../types/upload.types";
import { toSourceFileSummary } from "../types/upload.types";
import { runExtraction } from "./extractSourceFile";

const BLOB_MISSING =
  "We couldn't find the uploaded file. Please upload it again.";
const BLOB_MISMATCH =
  "The upload didn't finish correctly. Please upload the file again.";
const BLOB_NOT_PRIVATE =
  "The upload wasn't stored privately. Please upload the file again.";

/**
 * The browser chooses `access` when it calls `upload()`, and the client token
 * from `handleUpload` cannot constrain it. Reject anything that did not land on
 * the private blob host so the store's access mode is not client-controlled.
 */
function isPrivateBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".private.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export type FinalizeOutcome =
  | { kind: "not_found" }
  | { kind: "ok"; result: FinalizeUploadResult };

interface SummaryRow {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  errorReason: string | null;
  pageCount: number | null;
  charCount: number | null;
  quizId: string | null;
  blobKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function readSummary(source: SummaryRow): SourceFileSummary {
  return toSourceFileSummary({
    ...source,
    status: source.status as SourceFileSummary["status"],
  });
}

/**
 * Fails a source whose blob could not be verified. The blob is deleted only
 * when this call wins the claim, so a concurrent extraction never loses its
 * input mid-read.
 */
async function failUnverifiedUpload(
  source: SummaryRow,
  ownerId: string,
  pathname: string,
  message: string
): Promise<void> {
  const claimed = await db.sourceFile.updateMany({
    where: {
      id: source.id,
      ownerId,
      status: "UPLOADED",
    },
    data: {
      status: "FAILED",
      errorReason: message,
      extractedText: null,
      pages: Prisma.DbNull,
      pageCount: null,
      charCount: null,
    },
  });

  if (claimed.count === 0) return;

  try {
    await del(pathname);
    await db.sourceFile.update({
      where: { id: source.id },
      data: { blobKey: null, blobDeleteFailedAt: null },
    });
  } catch {
    await db.sourceFile.update({
      where: { id: source.id },
      data: { blobDeleteFailedAt: new Date() },
    });
  }
}

/**
 * Called by the browser after a direct upload resolves. Vercel Blob's
 * upload-completed callback does not fire on localhost, so this route is the
 * source of truth: it verifies ownership, existence, and size, then claims the
 * extraction. Lookups use `blobPathname`, which survives extraction, so calling
 * this after the binary is gone returns the finished source instead of a 404.
 */
export async function finalizeUpload(input: {
  ownerId: string;
  pathname: string;
}): Promise<FinalizeOutcome> {
  const source = await db.sourceFile.findFirst({
    where: { blobPathname: input.pathname, ownerId: input.ownerId },
  });

  if (!source) return { kind: "not_found" };

  if (source.status === "READY" || source.status === "FAILED") {
    return {
      kind: "ok",
      result: { sourceFile: readSummary(source), inProgress: false },
    };
  }

  if (
    source.status === "EXTRACTING" &&
    source.updatedAt.getTime() > Date.now() - ACTIVE_HEARTBEAT_MS
  ) {
    return {
      kind: "ok",
      result: { sourceFile: readSummary(source), inProgress: true },
    };
  }

  let blob: Awaited<ReturnType<typeof head>> | null = null;

  try {
    blob = await head(input.pathname);
  } catch {
    blob = null;
  }

  if (
    !blob ||
    blob.pathname !== input.pathname ||
    blob.size !== source.sizeBytes ||
    !isPrivateBlobUrl(blob.url)
  ) {
    await failUnverifiedUpload(
      source,
      input.ownerId,
      input.pathname,
      blob
        ? blob.pathname === input.pathname && blob.size === source.sizeBytes
          ? BLOB_NOT_PRIVATE
          : BLOB_MISMATCH
        : BLOB_MISSING
    );

    const refreshed = await db.sourceFile.findUnique({
      where: { id: source.id },
    });
    const current = refreshed ?? source;

    return {
      kind: "ok",
      result: {
        sourceFile: readSummary(current),
        inProgress:
          current.status === "UPLOADED" || current.status === "EXTRACTING",
      },
    };
  }

  const outcome = await runExtraction({
    sourceFileId: source.id,
    ownerId: input.ownerId,
  });

  if (!outcome) return { kind: "not_found" };

  return {
    kind: "ok",
    result: {
      sourceFile: outcome.sourceFile,
      inProgress: outcome.state === "in_progress",
    },
  };
}

/** Used by the retry route: only a failed row with a blob can be retried. */
export async function retryExtraction(input: {
  ownerId: string;
  sourceFileId: string;
}): Promise<FinalizeOutcome> {
  const source = await db.sourceFile.findFirst({
    where: { id: input.sourceFileId, ownerId: input.ownerId },
  });

  if (!source) return { kind: "not_found" };

  if (source.status !== "FAILED" || !source.blobKey) {
    return {
      kind: "ok",
      result: {
        sourceFile: readSummary(source),
        inProgress:
          source.status === "UPLOADED" || source.status === "EXTRACTING",
      },
    };
  }

  const outcome = await runExtraction({
    sourceFileId: source.id,
    ownerId: input.ownerId,
    retryFailed: true,
  });

  if (!outcome) return { kind: "not_found" };

  return {
    kind: "ok",
    result: {
      sourceFile: outcome.sourceFile,
      inProgress: outcome.state === "in_progress",
    },
  };
}
