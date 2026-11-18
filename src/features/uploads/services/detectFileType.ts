import { expectedMimeTypeForName } from "../constants";
import type { ExtractedDocument } from "../types/upload.types";
import {
  typeMismatchError,
  unsupportedTypeError,
} from "./extractionErrors";

export type DetectedFileKind = ExtractedDocument["kind"];

const CONTROL_WHITESPACE = new Set([0x09, 0x0a, 0x0d]);

function hasUtf16Bom(bytes: Uint8Array): boolean {
  return (
    (bytes[0] === 0xff && bytes[1] === 0xfe) ||
    (bytes[0] === 0xfe && bytes[1] === 0xff)
  );
}

/**
 * Text has no magic number. Accept it only when it has no null bytes and very
 * few non-whitespace control characters, so a renamed binary is rejected
 * instead of decoded into garbage.
 */
export function isProbablyText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false;
  if (hasUtf16Bom(bytes)) return true;

  const sample = bytes.subarray(0, Math.min(bytes.length, 8_192));
  let controlCharacters = 0;

  for (const byte of sample) {
    if (byte === 0x00) return false;
    if ((byte < 0x20 && !CONTROL_WHITESPACE.has(byte)) || byte === 0x7f) {
      controlCharacters += 1;
    }
  }

  if (controlCharacters / sample.length > 0.02) return false;

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    try {
      new TextDecoder("windows-1252").decode(bytes);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Detects the real container from magic bytes, never from the extension.
 * PDF and ZIP signatures are checked first so a corrupt Office container is
 * still reported as damaged rather than as plain text.
 */
export async function detectFileKind(
  bytes: Uint8Array
): Promise<DetectedFileKind> {
  const { fileTypeFromBuffer } = await import("file-type");

  let detected: Awaited<ReturnType<typeof fileTypeFromBuffer>>;

  try {
    detected = await fileTypeFromBuffer(bytes);
  } catch {
    detected = undefined;
  }

  if (detected?.ext === "pdf") return "pdf";
  if (detected?.ext === "docx") return "docx";
  if (detected?.ext === "pptx") return "pptx";
  if (!detected && isProbablyText(bytes)) return "txt";

  throw unsupportedTypeError();
}

const KIND_BY_MIME: Record<string, DetectedFileKind> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "text/plain": "txt",
};

/**
 * The extension decides which parser the user expects; the magic bytes decide
 * what the file really is. A disagreement means a spoofed or mislabeled file.
 */
export function assertKindMatchesName(
  kind: DetectedFileKind,
  originalName: string
): void {
  const expectedMime = expectedMimeTypeForName(originalName);
  const expectedKind = expectedMime ? KIND_BY_MIME[expectedMime] : undefined;

  if (!expectedKind || expectedKind !== kind) {
    throw typeMismatchError();
  }
}
