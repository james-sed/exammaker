import { z } from "zod";
import { db } from "@/lib/db";
import {
  MAX_UPLOAD_BYTES,
  expectedMimeTypeForName,
  normalizeUploadMimeType,
} from "../constants";
import { parseUploadPathname } from "./uploadPaths";

export class UploadTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadTokenError";
  }
}

const clientPayloadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().max(255).optional().nullable(),
  size: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES),
});

function parseClientPayload(raw: string | null) {
  if (!raw) {
    throw new UploadTokenError("Upload details are missing. Try again.");
  }

  let json: unknown;

  try {
    json = JSON.parse(raw);
  } catch {
    throw new UploadTokenError("Upload details are invalid. Try again.");
  }

  const parsed = clientPayloadSchema.safeParse(json);

  if (!parsed.success) {
    throw new UploadTokenError("Upload details are invalid. Try again.");
  }

  return parsed.data;
}

/**
 * Runs before a client token is minted. The SourceFile row exists before the
 * binary upload starts, which is what makes finalize idempotent and lets the
 * janitor find interrupted uploads.
 */
export async function ensureSourceFileForUpload(input: {
  userId: string;
  pathname: string;
  clientPayload: string | null;
}): Promise<{ sourceFileId: string }> {
  const parsedPath = parseUploadPathname(input.pathname);

  if (!parsedPath || parsedPath.userId !== input.userId) {
    throw new UploadTokenError("That upload destination isn't valid.");
  }

  const payload = parseClientPayload(input.clientPayload);

  if (!expectedMimeTypeForName(payload.name)) {
    throw new UploadTokenError(
      "Only PDF, DOCX, PPTX, and TXT files are supported."
    );
  }

  const mimeType = normalizeUploadMimeType(payload.name, payload.type);

  if (!mimeType) {
    throw new UploadTokenError(
      "Only PDF, DOCX, PPTX, and TXT files are supported."
    );
  }

  const existing = await db.sourceFile.findUnique({
    where: { blobPathname: input.pathname },
    select: {
      id: true,
      ownerId: true,
      status: true,
    },
  });

  if (existing) {
    if (existing.ownerId !== input.userId) {
      throw new UploadTokenError("That upload destination isn't valid.");
    }

    if (existing.status !== "UPLOADED") {
      throw new UploadTokenError(
        "This upload has already been processed. Start a new upload."
      );
    }

    await db.sourceFile.update({
      where: { id: existing.id },
      data: {
        originalName: payload.name,
        mimeType,
        sizeBytes: payload.size,
      },
    });

    return { sourceFileId: existing.id };
  }

  const created = await db.sourceFile.create({
    data: {
      ownerId: input.userId,
      originalName: payload.name,
      mimeType,
      sizeBytes: payload.size,
      blobPathname: input.pathname,
      blobKey: input.pathname,
      status: "UPLOADED",
    },
    select: { id: true },
  });

  return { sourceFileId: created.id };
}
