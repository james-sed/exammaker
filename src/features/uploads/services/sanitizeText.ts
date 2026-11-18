/**
 * Normalizes extracted source text before it is stored or sent to a model.
 *
 * Removes control characters and null bytes, normalizes newlines, collapses
 * horizontal whitespace, and caps blank lines at one. Non-ASCII letters are
 * preserved so non-English study material survives intact.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Sanitizes each page and joins them with a blank line for the flat text. */
export function sanitizePages(
  pages: Array<{ index: number; text: string }>
): Array<{ index: number; text: string }> {
  return pages
    .map((page) => ({ index: page.index, text: sanitizeText(page.text) }))
    .filter((page) => page.text.length > 0);
}

export function joinPageText(
  pages: Array<{ index: number; text: string }>
): string {
  return pages.map((page) => page.text).join("\n\n");
}
