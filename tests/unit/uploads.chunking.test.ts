import { describe, expect, it } from "vitest";
import {
  chunkPages,
  splitOversizedSentence,
  splitSentences,
} from "@/features/uploads/services/chunkPages";

describe("splitSentences", () => {
  it("splits on sentence endings without breaking decimals", () => {
    expect(splitSentences("The value is 3.14. Next one! Last?")).toEqual([
      "The value is 3.14.",
      "Next one!",
      "Last?",
    ]);
  });

  it("keeps closing quotes and brackets with the sentence", () => {
    expect(splitSentences('He said "stop." Then (quietly) left.')).toEqual([
      'He said "stop."',
      "Then (quietly) left.",
    ]);
  });

  it("splits paragraphs and collapses internal whitespace", () => {
    expect(splitSentences("First   paragraph.\n\nSecond\nparagraph.")).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
  });

  it("ignores empty input", () => {
    expect(splitSentences("   \n\n  ")).toEqual([]);
  });
});

describe("splitOversizedSentence", () => {
  it("returns a sentence that fits unchanged", () => {
    expect(splitOversizedSentence("short sentence", 20)).toEqual([
      "short sentence",
    ]);
  });

  it("splits on word boundaries so every piece fits", () => {
    expect(splitOversizedSentence("one two three four", 7)).toEqual([
      "one two",
      "three",
      "four",
    ]);
  });

  it("hard-slices a single word longer than the budget", () => {
    expect(splitOversizedSentence("abcdefghij", 4)).toEqual([
      "abcd",
      "efgh",
      "ij",
    ]);
  });

  it("hard-slices a long word without losing the surrounding words", () => {
    expect(splitOversizedSentence("before abcdefghij after", 5)).toEqual([
      "befor",
      "e",
      "abcde",
      "fghij",
      "after",
    ]);
  });
});

describe("chunkPages", () => {
  it("packs sentences up to the budget without exceeding it", () => {
    const chunks = chunkPages(
      [
        { index: 1, text: "First sentence. Second sentence." },
        { index: 2, text: "Third sentence." },
      ],
      20
    );

    expect(chunks).toEqual([
      {
        index: 0,
        text: "First sentence.",
        pageStart: 1,
        pageEnd: 1,
        charCount: 15,
      },
      {
        index: 1,
        text: "Second sentence.",
        pageStart: 1,
        pageEnd: 1,
        charCount: 16,
      },
      {
        index: 2,
        text: "Third sentence.",
        pageStart: 2,
        pageEnd: 2,
        charCount: 15,
      },
    ]);
  });

  it("lets one chunk span pages and records both ends", () => {
    const chunks = chunkPages(
      [
        { index: 1, text: "Alpha beta." },
        { index: 2, text: "Gamma delta." },
      ],
      100
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      text: "Alpha beta. Gamma delta.",
      pageStart: 1,
      pageEnd: 2,
    });
  });

  it("skips empty pages and keeps real page numbers", () => {
    const chunks = chunkPages(
      [
        { index: 1, text: "   " },
        { index: 2, text: "Real text." },
        { index: 3, text: "" },
      ],
      100
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ pageStart: 2, pageEnd: 2 });
  });

  it("keeps every chunk within the budget even for an unbroken word", () => {
    const chunks = chunkPages(
      [{ index: 1, text: "x".repeat(45) }],
      10
    );

    expect(chunks).toHaveLength(5);
    expect(chunks.every((chunk) => chunk.text.length <= 10)).toBe(true);
  });

  it("uses sequential indexes and an exact character count", () => {
    const chunks = chunkPages(
      [
        { index: 1, text: "One. Two. Three. Four." },
        { index: 2, text: "Five." },
      ],
      12
    );

    expect(chunks.map((chunk) => chunk.index)).toEqual(
      chunks.map((_, index) => index)
    );
    for (const chunk of chunks) {
      expect(chunk.charCount).toBe(chunk.text.length);
    }
  });

  it("returns no chunks for empty pages", () => {
    expect(chunkPages([{ index: 1, text: "" }])).toEqual([]);
  });

  it("rejects a non-positive budget", () => {
    expect(() => chunkPages([{ index: 1, text: "a" }], 0)).toThrow(
      "maxChars must be greater than zero"
    );
  });
});
