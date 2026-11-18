import { MAX_PAGES } from "../constants";
import type { ExtractedDocument } from "../types/upload.types";
import {
  ExtractionError,
  corruptFileError,
  noReadableTextError,
  passwordProtectedError,
  tooManyPagesError,
} from "./extractionErrors";

function isPasswordError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.name === "PasswordException" ||
    /password/i.test(error.message) ||
    /password/i.test(error.name)
  );
}

/**
 * Extracts text page by page with the serverless PDF.js build shipped by
 * unpdf. No native binaries or canvas are involved.
 */
export async function extractPdf(
  bytes: Uint8Array
): Promise<ExtractedDocument> {
  const { extractText, getDocumentProxy } = await import("unpdf");

  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | undefined;

  try {
    pdf = await getDocumentProxy(bytes);

    if (pdf.numPages > MAX_PAGES) {
      throw tooManyPagesError(pdf.numPages);
    }

    const { totalPages, text } = await extractText(pdf, {
      mergePages: false,
    });

    const pageTexts = Array.isArray(text) ? text : [text];
    const pages = pageTexts.map((pageText, index) => ({
      index: index + 1,
      text: pageText,
    }));

    if (pages.every((page) => page.text.trim().length === 0)) {
      throw noReadableTextError();
    }

    return { kind: "pdf", pages, pageCount: totalPages };
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    if (isPasswordError(error)) throw passwordProtectedError();
    throw corruptFileError("PDF");
  } finally {
    const destroyable = pdf as unknown as {
      destroy?: () => Promise<void>;
    };
    await destroyable?.destroy?.().catch(() => undefined);
  }
}
