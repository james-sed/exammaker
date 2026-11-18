import { MAX_UPLOAD_BYTES } from "../constants";
import type { ExtractedDocument } from "../types/upload.types";
import { detectFileKind, assertKindMatchesName } from "./detectFileType";
import { extractDocx } from "./extractDocx";
import { extractPdf } from "./extractPdf";
import { extractPptx } from "./extractPptx";
import { extractTxt } from "./extractTxt";
import {
  emptyFileError,
  tooLargeError,
} from "./extractionErrors";

export interface ExtractDocumentInput {
  bytes: Uint8Array;
  originalName: string;
}

/**
 * The only place a source binary is turned into text. Detection happens on the
 * real bytes, then the extension is checked against the detected container.
 */
export async function extractDocument({
  bytes,
  originalName,
}: ExtractDocumentInput): Promise<ExtractedDocument> {
  if (bytes.length === 0) throw emptyFileError();
  if (bytes.length > MAX_UPLOAD_BYTES) throw tooLargeError();

  const kind = await detectFileKind(bytes);
  assertKindMatchesName(kind, originalName);

  switch (kind) {
    case "pdf":
      return extractPdf(bytes);
    case "docx":
      return extractDocx(bytes);
    case "pptx":
      return extractPptx(bytes);
    case "txt":
      return extractTxt(bytes);
  }
}
