import { describe, expect, it } from "vitest";
import {
  joinPageText,
  sanitizePages,
  sanitizeText,
} from "@/features/uploads/services/sanitizeText";

describe("sanitizeText", () => {
  it("normalizes CRLF and lone carriage returns", () => {
    expect(sanitizeText("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("removes null bytes and non-whitespace control characters", () => {
    expect(sanitizeText("a\u0000b\u0007c\u007Fd\u0085e")).toBe("abcde");
  });

  it("removes zero-width characters and the byte-order mark", () => {
    expect(sanitizeText("a\u200Bb\u200Cc\uFEFFd")).toBe("abcd");
  });

  it("turns non-breaking spaces and tabs into single spaces", () => {
    expect(sanitizeText("a\u00A0\u00A0b\t\tc")).toBe("a b c");
  });

  it("trims spaces around newlines and caps blank lines at one", () => {
    expect(sanitizeText("  a  \n   b  \n\n\n\nc  ")).toBe("a\nb\n\nc");
  });

  it("preserves non-ASCII letters and punctuation", () => {
    expect(sanitizeText("café — 日本語 naïve")).toBe("café — 日本語 naïve");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(sanitizeText(" \n\t \u00A0 ")).toBe("");
  });
});

describe("sanitizePages", () => {
  it("sanitizes each page and drops pages that become empty", () => {
    expect(
      sanitizePages([
        { index: 1, text: "  Section one.  " },
        { index: 2, text: " \n\t " },
        { index: 3, text: "\u0000\u0007" },
        { index: 4, text: "Section four." },
      ])
    ).toEqual([
      { index: 1, text: "Section one." },
      { index: 4, text: "Section four." },
    ]);
  });

  it("keeps page indexes unchanged when earlier pages are dropped", () => {
    const pages = sanitizePages([
      { index: 1, text: "" },
      { index: 2, text: "Only page with text." },
    ]);

    expect(pages).toEqual([{ index: 2, text: "Only page with text." }]);
  });
});

describe("joinPageText", () => {
  it("joins pages with a blank line", () => {
    expect(
      joinPageText([
        { index: 1, text: "One." },
        { index: 4, text: "Two." },
      ])
    ).toBe("One.\n\nTwo.");
  });

  it("returns an empty string for no pages", () => {
    expect(joinPageText([])).toBe("");
  });
});
