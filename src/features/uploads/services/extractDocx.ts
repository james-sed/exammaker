import { MAX_PAGES } from "../constants";
import type { ExtractedDocument } from "../types/upload.types";
import {
  corruptFileError,
  noReadableTextError,
  tooLargeError,
  tooManyPagesError,
} from "./extractionErrors";

type OrderedNode = Record<string, unknown>;

const MAX_DOCUMENT_XML_BYTES = 64 * 1024 * 1024;

function attributesOf(node: OrderedNode): Record<string, unknown> {
  const attributes = node[":@"];
  return attributes && typeof attributes === "object"
    ? (attributes as Record<string, unknown>)
    : {};
}

function attribute(
  attributes: Record<string, unknown>,
  name: string
): unknown {
  return attributes[`@_${name}`] ?? attributes[name];
}

/**
 * Walks the document in order and records explicit page breaks. DOCX does not
 * store final page layout, so a document without page breaks is one section.
 */
export function collectDocxPages(nodes: unknown[]): string[] {
  const pages: string[] = [""];
  const append = (text: string) => {
    pages[pages.length - 1] += text;
  };

  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (!value || typeof value !== "object") return;
    const node = value as OrderedNode;

    for (const [key, child] of Object.entries(node)) {
      if (key === ":@") continue;

      if (key === "#text") {
        if (typeof child === "string") append(child);
        continue;
      }

      if (key === "w:t") {
        walk(child);
        continue;
      }

      if (key === "w:tab") {
        append(" ");
        continue;
      }

      if (key === "w:br") {
        const type = attribute(attributesOf(node), "w:type");
        if (type === "page") {
          pages.push("");
        } else {
          append("\n");
        }
        continue;
      }

      if (key === "w:lastRenderedPageBreak") {
        pages.push("");
        continue;
      }

      if (key === "w:p") {
        append("\n\n");
        walk(child);
        continue;
      }

      // Field instructions and tracked deletions are not document content.
      if (key === "w:instrText" || key === "w:delText") continue;

      if (Array.isArray(child)) walk(child);
    }
  };

  walk(nodes);
  return pages;
}

function declaredUncompressedSize(entry: {
  _data?: { uncompressedSize?: number };
}): number | undefined {
  return entry._data?.uncompressedSize;
}

/** Extracts DOCX paragraphs with explicit page breaks as section boundaries. */
export async function extractDocx(
  bytes: Uint8Array
): Promise<ExtractedDocument> {
  const JSZip = (await import("jszip")).default;
  const { XMLParser } = await import("fast-xml-parser");

  let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>;

  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw corruptFileError("DOCX");
  }

  const documentEntry = zip.file("word/document.xml");
  if (!documentEntry) throw corruptFileError("DOCX");

  const uncompressedSize = declaredUncompressedSize(
    documentEntry as unknown as { _data?: { uncompressedSize?: number } }
  );
  if (uncompressedSize !== undefined && uncompressedSize > MAX_DOCUMENT_XML_BYTES) {
    throw tooLargeError();
  }

  let xml: string;
  try {
    xml = await documentEntry.async("string");
  } catch {
    throw corruptFileError("DOCX");
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    preserveOrder: true,
    trimValues: false,
  });

  let parsed: unknown;
  try {
    parsed = parser.parse(xml);
  } catch {
    throw corruptFileError("DOCX");
  }

  const rawPages = collectDocxPages(Array.isArray(parsed) ? parsed : []);

  if (rawPages.length > MAX_PAGES) {
    throw tooManyPagesError(rawPages.length);
  }

  const pages = rawPages.map((text, index) => ({
    index: index + 1,
    text,
  }));

  if (pages.every((page) => page.text.trim().length === 0)) {
    throw noReadableTextError();
  }

  return { kind: "docx", pages, pageCount: rawPages.length };
}
