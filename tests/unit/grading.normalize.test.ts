import { describe, expect, it } from "vitest";

import { normalizeText } from "@/features/grading/normalize";

describe("normalizeText", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeText("  mitochondrial   matrix  ")).toBe(
      "mitochondrial matrix"
    );
    expect(normalizeText("x\n\tb")).toBe("x b");
  });

  it("lowercases by default", () => {
    expect(normalizeText("MiToChOnDrIoN")).toBe("mitochondrion");
  });

  it("preserves casing when caseSensitive is true", () => {
    expect(normalizeText("MiToChOnDrIoN", { caseSensitive: true })).toBe(
      "MiToChOnDrIoN"
    );
  });

  it("strips punctuation", () => {
    expect(normalizeText("mitochondrion.")).toBe("mitochondrion");
    expect(normalizeText("(nucleus), ribosome!")).toBe("nucleus ribosome");
    expect(normalizeText("well-known")).toBe("well known");
    expect(normalizeText("cell's membrane")).toBe("cell s membrane");
  });

  it("strips leading articles", () => {
    expect(normalizeText("the mitochondrion")).toBe("mitochondrion");
    expect(normalizeText("a ribosome")).toBe("ribosome");
    expect(normalizeText("an organelle")).toBe("organelle");
    expect(normalizeText("The Nucleus.")).toBe("nucleus");
  });

  it("only strips a leading article once", () => {
    expect(normalizeText("the the nucleus")).toBe("the nucleus");
  });

  it("does not strip an article that is part of a word", () => {
    expect(normalizeText("theory")).toBe("theory");
    expect(normalizeText("another")).toBe("another");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeText("")).toBe("");
    expect(normalizeText("   ")).toBe("");
    expect(normalizeText("!!!")).toBe("");
  });

  it("returns an empty string for non-string input", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
    expect(normalizeText(42)).toBe("");
    expect(normalizeText(["nucleus"])).toBe("");
  });
});
