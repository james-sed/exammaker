export interface NormalizeOptions {
  /** Keep the original casing. Defaults to false (case-insensitive). */
  caseSensitive?: boolean;
}

const LEADING_ARTICLE = /^(?:a|an|the)\s+/i;
const NOT_LETTER_OR_NUMBER = /[^\p{L}\p{N}\s]/gu;
const WHITESPACE = /\s+/g;

/**
 * Canonical text form used for identification and enumeration matching:
 *
 * 1. Trim and collapse whitespace.
 * 2. Strip punctuation (everything that is not a letter, number, or space).
 * 3. Drop one leading article ("a", "an", "the").
 * 4. Lowercase unless `caseSensitive` is true.
 *
 * Non-string input normalizes to an empty string so callers never throw.
 */
export function normalizeText(
  input: unknown,
  options: NormalizeOptions = {}
): string {
  if (typeof input !== "string") {
    return "";
  }

  let text = input
    .normalize("NFKC")
    .replace(WHITESPACE, " ")
    .trim()
    .replace(NOT_LETTER_OR_NUMBER, " ")
    .replace(WHITESPACE, " ")
    .trim()
    .replace(LEADING_ARTICLE, "")
    .trim();

  if (!options.caseSensitive) {
    text = text.toLowerCase();
  }

  return text;
}
