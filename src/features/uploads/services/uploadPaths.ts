import { BLOB_PREFIX } from "../constants";

const UPLOAD_PATHNAME = /^sources\/([^/]+)\/([A-Za-z0-9-]{8,64})$/;

export interface ParsedUploadPathname {
  userId: string;
  uploadId: string;
}

export function uploadPathPrefix(userId: string): string {
  return `${BLOB_PREFIX}${userId}/`;
}

export function buildUploadPathname(
  userId: string,
  uploadId: string
): string {
  return `${uploadPathPrefix(userId)}${uploadId}`;
}

/**
 * Upload pathnames are chosen by the client and validated by the server on
 * token issuance. The same format is re-parsed on finalize.
 */
export function parseUploadPathname(
  pathname: string
): ParsedUploadPathname | null {
  const match = UPLOAD_PATHNAME.exec(pathname);
  if (!match) return null;

  return { userId: match[1], uploadId: match[2] };
}
