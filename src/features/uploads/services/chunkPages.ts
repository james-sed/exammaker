import { DEFAULT_CHUNK_CHARS } from "../constants";
import type { SourcePage, TextChunk } from "../types/upload.types";

const SENTENCE_BOUNDARY = /(?<=[.!?]["')\]]*)(?=\s)/;

/**
 * Splits text at sentence endings, never inside a number or word. Multiple
 * sentence terminators and a closing quote stay with the sentence.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .flatMap((paragraph) => paragraph.split(SENTENCE_BOUNDARY))
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length > 0);
}

/**
 * A single sentence that exceeds the budget is split on word boundaries. A
 * single word longer than the budget is hard-sliced so no chunk can exceed it.
 */
export function splitOversizedSentence(
  sentence: string,
  maxChars: number
): string[] {
  if (sentence.length <= maxChars) return [sentence];

  const pieces: string[] = [];
  let current = "";

  for (const word of sentence.split(/\s+/)) {
    if (word.length > maxChars) {
      if (current) {
        pieces.push(current);
        current = "";
      }

      for (let index = 0; index < word.length; index += maxChars) {
        pieces.push(word.slice(index, index + maxChars));
      }

      continue;
    }

    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ` ${word}`;
    } else {
      pieces.push(current);
      current = word;
    }
  }

  if (current) pieces.push(current);
  return pieces;
}

interface DraftChunk {
  parts: string[];
  length: number;
  pageStart: number;
  pageEnd: number;
}

/**
 * Packs sentences into model-sized chunks while keeping page references.
 * Empty pages are skipped; a chunk may span pages and records both ends.
 */
export function chunkPages(
  pages: SourcePage[],
  maxChars: number = DEFAULT_CHUNK_CHARS
): TextChunk[] {
  if (maxChars <= 0) throw new Error("maxChars must be greater than zero");

  const chunks: TextChunk[] = [];
  let current: DraftChunk | null = null;

  const flush = () => {
    if (!current || current.parts.length === 0) {
      current = null;
      return;
    }

    const text = current.parts.join(" ").trim();

    if (text.length > 0) {
      chunks.push({
        index: chunks.length,
        text,
        pageStart: current.pageStart,
        pageEnd: current.pageEnd,
        charCount: text.length,
      });
    }

    current = null;
  };

  for (const page of pages) {
    for (const sentence of splitSentences(page.text)) {
      for (const piece of splitOversizedSentence(sentence, maxChars)) {
        const addedLength = current ? piece.length + 1 : piece.length;

        if (current && current.length + addedLength > maxChars) {
          flush();
        }

        if (!current) {
          current = {
            parts: [],
            length: 0,
            pageStart: page.index,
            pageEnd: page.index,
          };
        }

        current.parts.push(piece);
        current.length +=
          (current.parts.length > 1 ? 1 : 0) + piece.length;
        current.pageEnd = page.index;
      }
    }
  }

  flush();
  return chunks;
}
