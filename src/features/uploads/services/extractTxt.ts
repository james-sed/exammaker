import type { ExtractedDocument } from "../types/upload.types";
import {
  corruptFileError,
  noReadableTextError,
} from "./extractionErrors";

/**
 * Decodes TXT bytes, honoring UTF-8/UTF-16 BOMs and falling back to
 * windows-1252 for older documents. TextDecoder is built into Node.
 */
export function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  }

  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(bytes.subarray(3));
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    try {
      return new TextDecoder("windows-1252").decode(bytes);
    } catch {
      throw corruptFileError("TXT");
    }
  }
}

export function extractTxt(bytes: Uint8Array): ExtractedDocument {
  const text = decodeText(bytes);

  if (text.trim().length === 0) {
    throw noReadableTextError();
  }

  return {
    kind: "txt",
    pages: [{ index: 1, text }],
    pageCount: 1,
  };
}
