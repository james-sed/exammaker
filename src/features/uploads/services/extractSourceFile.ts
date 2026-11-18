import { Prisma } from "@prisma/client";
import { del, get } from "@vercel/blob";
import { db } from "@/lib/db";
import {
  ACTIVE_HEARTBEAT_MS,
  MAX_EXTRACTED_CHARACTERS,
} from "../constants";
import type {
  ExtractionOutcome,
  SourceFileSummary,
} from "../types/upload.types";
import { toSourceFileSummary } from "../types/upload.types";
import { extractDocument } from "./extractDocument";
import {
  ExtractionError,
  extractionErrorMessages,
  noReadableTextError,
  tooManyCharactersError,
} from "./extractionErrors";
import { joinPageText, sanitizePages } from "./sanitizeText";
import type { SourcePage } from "../types/upload.types";

const BLOB_READ_FAILED =
  "We couldn't read the uploaded file. Please upload it again.";

export interface RunExtractionInput {
  sourceFileId: string;
  ownerId: string;
  /** Allows retrying a FAILED row that still has a blob. */
  retryFailed?: boolean;
}

async function clearBlobKey(sourceFileId: string): Promise<void> {
  await db.sourceFile.update({
    where: { id: sourceFileId },
    data: { blobKey: null, blobDeleteFailedAt: null },
  });
}

async function flagBlobDeleteFailure(sourceFileId: string): Promise<void> {
  await db.sourceFile.update({
    where: { id: sourceFileId },
    data: { blobDeleteFailedAt: new Date() },
  });
}

async function deleteBlobBestEffort(
  sourceFileId: string,
  blobKey: string
): Promise<void> {
  try {
    await del(blobKey);
    await clearBlobKey(sourceFileId);
  } catch {
    await flagBlobDeleteFailure(sourceFileId);
  }
}

async function failSource(
  sourceFileId: string,
  message: string,
  blobKey: string | null
): Promise<ExtractionOutcome> {
  const failed = await db.sourceFile.update({
    where: { id: sourceFileId },
    data: {
      status: "FAILED",
      errorReason: message,
      extractedText: null,
      pages: Prisma.DbNull,
      pageCount: null,
      charCount: null,
    },
  });

  if (blobKey) {
    await deleteBlobBestEffort(sourceFileId, blobKey);
    const refreshed = await db.sourceFile.findUnique({
      where: { id: sourceFileId },
    });
    if (refreshed) {
      return {
        state: "failed",
        sourceFile: toSourceFileSummary(refreshed),
      };
    }
  }

  return { state: "failed", sourceFile: toSourceFileSummary(failed) };
}

function readSummary(source: {
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
}): SourceFileSummary {
  return toSourceFileSummary({
    ...source,
    status: source.status as SourceFileSummary["status"],
  });
}

/**
 * Atomically claims a source and extracts it. A claim only succeeds for a
 * fresh upload or a running extraction whose heartbeat is older than the
 * active window, so a double finalize extracts once.
 */
export async function runExtraction({
  sourceFileId,
  ownerId,
  retryFailed = false,
}: RunExtractionInput): Promise<ExtractionOutcome | null> {
  const staleBefore = new Date(Date.now() - ACTIVE_HEARTBEAT_MS);

  const claimable: Array<Record<string, unknown>> = [
    { status: "UPLOADED" },
    { status: "EXTRACTING", updatedAt: { lt: staleBefore } },
  ];

  if (retryFailed) {
    claimable.push({ status: "FAILED", blobKey: { not: null } });
  }

  const claim = await db.sourceFile.updateMany({
    where: {
      id: sourceFileId,
      ownerId,
      OR: claimable,
    } as never,
    data: {
      status: "EXTRACTING",
      errorReason: null,
      blobDeleteFailedAt: null,
      updatedAt: new Date(),
    },
  });

  if (claim.count === 0) {
    const existing = await db.sourceFile.findFirst({
      where: { id: sourceFileId, ownerId },
    });

    if (!existing) return null;

    return {
      state:
        existing.status === "READY"
          ? "ready"
          : existing.status === "FAILED"
            ? "failed"
            : "in_progress",
      sourceFile: readSummary(existing),
    };
  }

  const source = await db.sourceFile.findFirst({
    where: { id: sourceFileId, ownerId },
  });

  if (!source) return null;

  if (!source.blobKey) {
    return failSource(
      source.id,
      extractionErrorMessages.failed,
      null
    );
  }

  const blobKey = source.blobKey;

  let bytes: Uint8Array;

  try {
    const blob = await get(blobKey, { access: "private", useCache: false });

    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return failSource(source.id, BLOB_READ_FAILED, blobKey);
    }

    bytes = new Uint8Array(await new Response(blob.stream).arrayBuffer());
  } catch {
    return failSource(source.id, BLOB_READ_FAILED, blobKey);
  }

  let pages: SourcePage[];
  let pageCount: number;
  let detectedKind: "pdf" | "docx" | "pptx" | "txt";

  try {
    const document = await extractDocument({
      bytes,
      originalName: source.originalName,
    });

    pages = document.pages;
    pageCount = document.pageCount;
    detectedKind = document.kind;
  } catch (error) {
    const message =
      error instanceof ExtractionError
        ? error.message
        : extractionErrorMessages.failed;

    return failSource(source.id, message, blobKey);
  }

  const sanitizedPages = sanitizePages(pages);
  const extractedText = joinPageText(sanitizedPages);

  if (sanitizedPages.length === 0 || extractedText.length === 0) {
    return failSource(source.id, noReadableTextError().message, blobKey);
  }

  if (extractedText.length > MAX_EXTRACTED_CHARACTERS) {
    return failSource(
      source.id,
      tooManyCharactersError(extractedText.length).message,
      blobKey
    );
  }

  const mimeType =
    detectedKind === "pdf"
      ? "application/pdf"
      : detectedKind === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : detectedKind === "pptx"
          ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
          : "text/plain";

  // Save the sanitized text before touching the binary. If deleting the blob
  // fails, the row still has usable text and the janitor retries the delete.
  const saved = await db.sourceFile.update({
    where: { id: source.id },
    data: {
      status: "READY",
      errorReason: null,
      extractedText,
      pages: sanitizedPages,
      pageCount,
      charCount: extractedText.length,
      mimeType,
    },
  });

  try {
    await del(blobKey);
    const cleared = await db.sourceFile.update({
      where: { id: source.id },
      data: { blobKey: null, blobDeleteFailedAt: null },
    });

    return { state: "ready", sourceFile: readSummary(cleared) };
  } catch {
    const flagged = await db.sourceFile.update({
      where: { id: source.id },
      data: { blobDeleteFailedAt: new Date() },
    });

    return { state: "ready", sourceFile: readSummary(flagged) };
  }
}
