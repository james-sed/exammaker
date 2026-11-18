import type { SourcePage } from "../types/upload.types";

export function parseSourcePages(value: unknown): SourcePage[] | null {
  if (!Array.isArray(value)) return null;

  const pages = value
    .filter(
      (page): page is { index: number; text: string } =>
        Boolean(page) &&
        typeof page === "object" &&
        typeof (page as { index?: unknown }).index === "number" &&
        typeof (page as { text?: unknown }).text === "string"
    )
    .map((page) => ({ index: page.index, text: page.text }));

  return pages.length > 0 ? pages : null;
}
