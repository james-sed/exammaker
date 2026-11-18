import {
  MAX_EXTRACTED_CHARACTERS,
  MAX_PAGES,
} from "../constants";

export type ExtractionErrorCode =
  | "EMPTY_FILE"
  | "UNSUPPORTED_TYPE"
  | "TYPE_MISMATCH"
  | "PASSWORD_PROTECTED"
  | "CORRUPT_FILE"
  | "TOO_MANY_PAGES"
  | "TOO_MUCH_TEXT"
  | "NO_READABLE_TEXT"
  | "FILE_TOO_LARGE"
  | "EXTRACTION_FAILED";

/**
 * Extraction failures carry a message that is safe to show to the user.
 * Codes are for tests and logging, not for the UI.
 */
export class ExtractionError extends Error {
  constructor(
    public readonly code: ExtractionErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

const numberFormat = new Intl.NumberFormat("en-US");

export const extractionErrorMessages = {
  empty: "This file is empty. Upload a file that contains text.",
  unsupported:
    "That file type isn't supported. Upload a PDF, DOCX, PPTX, or TXT file.",
  typeMismatch:
    "The file's contents don't match its extension. Upload a real PDF, DOCX, PPTX, or TXT file.",
  passwordProtected:
    "This file is password-protected. Remove the password, then upload it again.",
  noReadableText:
    "This file has no readable text. Scanned or image-only PDFs aren't supported yet — upload a file with selectable text.",
  failed:
    "Something went wrong while reading this file. Try uploading it again.",
  tooLarge:
    "This file contains too much embedded data to process. Try a smaller or simpler file.",
  tooManyPages: (count: number) =>
    `This file has ${numberFormat.format(count)} pages. The limit is ${MAX_PAGES}. Split it and upload a smaller file.`,
  tooManyCharacters: (count: number) =>
    `This file contains ${numberFormat.format(count)} characters of text. The limit is ${numberFormat.format(MAX_EXTRACTED_CHARACTERS)}.`,
  corrupt: (label: string) =>
    `This ${label} file appears to be damaged and can't be read. Try exporting it again.`,
} as const;

export function extractionError(
  code: ExtractionErrorCode,
  message: string
): ExtractionError {
  return new ExtractionError(code, message);
}

export function emptyFileError(): ExtractionError {
  return extractionError("EMPTY_FILE", extractionErrorMessages.empty);
}

export function unsupportedTypeError(): ExtractionError {
  return extractionError(
    "UNSUPPORTED_TYPE",
    extractionErrorMessages.unsupported
  );
}

export function typeMismatchError(): ExtractionError {
  return extractionError(
    "TYPE_MISMATCH",
    extractionErrorMessages.typeMismatch
  );
}

export function passwordProtectedError(): ExtractionError {
  return extractionError(
    "PASSWORD_PROTECTED",
    extractionErrorMessages.passwordProtected
  );
}

export function noReadableTextError(): ExtractionError {
  return extractionError(
    "NO_READABLE_TEXT",
    extractionErrorMessages.noReadableText
  );
}

export function corruptFileError(label: string): ExtractionError {
  return extractionError(
    "CORRUPT_FILE",
    extractionErrorMessages.corrupt(label)
  );
}

export function tooManyPagesError(count: number): ExtractionError {
  return extractionError(
    "TOO_MANY_PAGES",
    extractionErrorMessages.tooManyPages(count)
  );
}

export function tooManyCharactersError(count: number): ExtractionError {
  return extractionError(
    "TOO_MUCH_TEXT",
    extractionErrorMessages.tooManyCharacters(count)
  );
}

export function tooLargeError(): ExtractionError {
  return extractionError("FILE_TOO_LARGE", extractionErrorMessages.tooLarge);
}
