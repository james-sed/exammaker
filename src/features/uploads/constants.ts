/**
 * Limits and accepted types for source uploads. These are enforced twice:
 * once on the client for fast feedback and once on the server (token issuance
 * and extraction) because the binary never passes through the app server.
 */

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_PAGES = 150;
export const MAX_EXTRACTED_CHARACTERS = 200_000;

/** Target size for one model-sized chunk (roughly 1,500 tokens). */
export const DEFAULT_CHUNK_CHARS = 6_000;

/**
 * A source is only treated as actively processing while its status is running
 * and it was touched within this window. Cron frequency must never gate
 * correctness, so stale rows are always safe to reclaim.
 */
export const ACTIVE_HEARTBEAT_MS = 10 * 60 * 1000;

/** Unattached sources (no draft quiz yet) are removed after this long. */
export const UNATTACHED_SOURCE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/** All uploads live under this prefix so the janitor can scope its blob scan. */
export const BLOB_PREFIX = "sources/";

export const ACCEPTED_UPLOAD_TYPES = [
  { extension: ".pdf", mimeType: "application/pdf", label: "PDF" },
  {
    extension: ".docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "DOCX",
  },
  {
    extension: ".pptx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    label: "PPTX",
  },
  { extension: ".txt", mimeType: "text/plain", label: "TXT" },
] as const;

export type AcceptedMimeType =
  (typeof ACCEPTED_UPLOAD_TYPES)[number]["mimeType"];

export const ALLOWED_CONTENT_TYPES: AcceptedMimeType[] =
  ACCEPTED_UPLOAD_TYPES.map((type) => type.mimeType);

export const ACCEPT_ATTRIBUTE = ACCEPTED_UPLOAD_TYPES.map(
  (type) => `${type.extension},${type.mimeType}`
).join(",");

export const ACCEPTED_EXTENSIONS_LABEL = "PDF, DOCX, PPTX, or TXT";

const MIME_BY_EXTENSION: Record<string, AcceptedMimeType> = Object.fromEntries(
  ACCEPTED_UPLOAD_TYPES.map((type) => [type.extension, type.mimeType])
);

export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

export function expectedMimeTypeForName(
  fileName: string
): AcceptedMimeType | null {
  return MIME_BY_EXTENSION[fileExtension(fileName)] ?? null;
}

export function isAcceptedMimeType(value: unknown): value is AcceptedMimeType {
  return (
    typeof value === "string" &&
    (ALLOWED_CONTENT_TYPES as string[]).includes(value)
  );
}

/**
 * Browsers occasionally report an empty or generic type for Office files and
 * TXT. Since extraction verifies magic bytes anyway, normalize the declared
 * type from the extension for the upload token and DB row.
 */
export function normalizeUploadMimeType(
  fileName: string,
  declared?: string | null
): AcceptedMimeType | null {
  if (isAcceptedMimeType(declared)) {
    return declared;
  }

  return expectedMimeTypeForName(fileName);
}

export type SourceFileStatus =
  | "UPLOADED"
  | "EXTRACTING"
  | "GENERATING"
  | "READY"
  | "FAILED";

/** Statuses that can be reclaimed by a retry, finalize, or the janitor. */
export const RUNNING_SOURCE_STATUSES: SourceFileStatus[] = [
  "UPLOADED",
  "EXTRACTING",
];
