import type { UploadOptions } from "@vercel/blob/client";
import type { AcceptedMimeType } from "./constants";

type ClientUploadOptions = Omit<
  UploadOptions,
  "access" | "handleUploadUrl"
>;

/**
 * Options the browser passes to `upload()`. The pathname is an opaque UUID
 * with no extension, so Blob would otherwise derive `application/octet-stream`
 * from it and reject the upload against the token's content-type allowlist.
 * `contentType` is therefore always sent explicitly.
 */
export function buildClientUploadOptions(input: {
  mimeType: AcceptedMimeType;
  fileName: string;
  sizeBytes: number;
  abortSignal: AbortSignal;
  onProgress: (percentage: number) => void;
}): ClientUploadOptions {
  return {
    contentType: input.mimeType,
    clientPayload: JSON.stringify({
      name: input.fileName,
      type: input.mimeType,
      size: input.sizeBytes,
    }),
    abortSignal: input.abortSignal,
    onUploadProgress: ({ percentage }) => {
      input.onProgress(Math.round(percentage));
    },
  };
}
