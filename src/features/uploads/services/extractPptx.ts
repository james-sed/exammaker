import { MAX_PAGES } from "../constants";
import type { ExtractedDocument } from "../types/upload.types";
import {
  corruptFileError,
  noReadableTextError,
  tooLargeError,
  tooManyPagesError,
} from "./extractionErrors";

type OrderedNode = Record<string, unknown>;

const MAX_SLIDE_XML_BYTES = 8 * 1024 * 1024;

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Extracts visible slide text, keeping paragraph and line breaks. */
export function collectSlideText(nodes: unknown[]): string {
  let text = "";

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
        if (typeof child === "string") text += child;
        continue;
      }

      if (key === "a:t") {
        walk(child);
        continue;
      }

      if (key === "a:br") {
        text += "\n";
        continue;
      }

      if (key === "a:p") {
        text += "\n\n";
        walk(child);
        continue;
      }

      if (key === "a:rPr" || key === "a:pPr" || key === "a:endParaRPr") {
        continue;
      }

      if (Array.isArray(child)) walk(child);
    }
  };

  walk(nodes);
  return text;
}

function normalizeSlideTarget(target: string): string {
  let normalized = target.replace(/\\/g, "/");
  if (normalized.startsWith("/")) normalized = normalized.slice(1);
  if (!normalized.startsWith("ppt/")) normalized = `ppt/${normalized}`;
  return normalized;
}

function fallbackSlideOrder(zip: {
  files: Record<string, unknown>;
}): string[] {
  return Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const aNumber = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      const bNumber = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      return aNumber - bNumber;
    });
}

/**
 * Reads slide order from presentation.xml + its relationships, falling back to
 * numeric file names when those parts are absent. Slide numbers stay exact.
 */
export function resolveSlideOrder(
  presentationXml: string | null,
  relsXml: string | null,
  zip: { files: Record<string, unknown> },
  parseXml: (xml: string) => unknown
): string[] {
  if (presentationXml && relsXml) {
    try {
      const rels = parseXml(relsXml) as {
        Relationships?: {
          Relationship?: unknown;
        };
      };

      const targetById = new Map<string, string>();

      for (const relationship of asArray(
        rels?.Relationships?.Relationship as
          | Record<string, unknown>
          | Record<string, unknown>[]
          | undefined
      )) {
        const id = relationship?.["@_Id"];
        const target = relationship?.["@_Target"];

        if (typeof id === "string" && typeof target === "string") {
          targetById.set(id, normalizeSlideTarget(target));
        }
      }

      const presentation = parseXml(presentationXml) as {
        "p:presentation"?: {
          "p:sldIdLst"?: { "p:sldId"?: unknown };
        };
      };

      const ordered = asArray(
        presentation?.["p:presentation"]?.["p:sldIdLst"]?.["p:sldId"] as
          | Record<string, unknown>
          | Record<string, unknown>[]
          | undefined
      )
        .map((slideId) => {
          const relationshipId = slideId?.["@_r:id"];
          return typeof relationshipId === "string"
            ? targetById.get(relationshipId)
            : undefined;
        })
        .filter((target): target is string => Boolean(target));

      if (ordered.length > 0) return ordered;
    } catch {
      // Fall through to the numeric order.
    }
  }

  return fallbackSlideOrder(zip);
}

function declaredUncompressedSize(entry: {
  _data?: { uncompressedSize?: number };
}): number | undefined {
  return entry._data?.uncompressedSize;
}

/** Extracts PPTX slides as pages, in presentation order. */
export async function extractPptx(
  bytes: Uint8Array
): Promise<ExtractedDocument> {
  const JSZip = (await import("jszip")).default;
  const { XMLParser } = await import("fast-xml-parser");

  let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>;

  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw corruptFileError("PPTX");
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    preserveOrder: true,
    trimValues: false,
  });

  const plainParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const presentationEntry = zip.file("ppt/presentation.xml");
  const relsEntry = zip.file("ppt/_rels/presentation.xml.rels");

  const presentationXml = presentationEntry
    ? await presentationEntry.async("string").catch(() => null)
    : null;
  const relsXml = relsEntry
    ? await relsEntry.async("string").catch(() => null)
    : null;

  const slidePaths = resolveSlideOrder(
    presentationXml,
    relsXml,
    zip,
    (xml) => plainParser.parse(xml)
  );

  if (slidePaths.length === 0) {
    throw corruptFileError("PPTX");
  }

  if (slidePaths.length > MAX_PAGES) {
    throw tooManyPagesError(slidePaths.length);
  }

  const pages: Array<{ index: number; text: string }> = [];

  for (const [index, slidePath] of slidePaths.entries()) {
    const slideEntry = zip.file(slidePath);

    if (!slideEntry) continue;

    const uncompressedSize = declaredUncompressedSize(
      slideEntry as unknown as { _data?: { uncompressedSize?: number } }
    );

    if (
      uncompressedSize !== undefined &&
      uncompressedSize > MAX_SLIDE_XML_BYTES
    ) {
      throw tooLargeError();
    }

    let slideXml: string;
    try {
      slideXml = await slideEntry.async("string");
    } catch {
      throw corruptFileError("PPTX");
    }

    let parsed: unknown;
    try {
      parsed = parser.parse(slideXml);
    } catch {
      throw corruptFileError("PPTX");
    }

    pages.push({
      index: index + 1,
      text: collectSlideText(Array.isArray(parsed) ? parsed : []),
    });
  }

  if (pages.every((page) => page.text.trim().length === 0)) {
    throw noReadableTextError();
  }

  return { kind: "pptx", pages, pageCount: slidePaths.length };
}
