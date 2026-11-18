import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES } from "@/features/uploads/constants";
import { extractDocument } from "@/features/uploads/services/extractDocument";
import {
  assertKindMatchesName,
  detectFileKind,
  isProbablyText,
} from "@/features/uploads/services/detectFileType";

const PNG_1X1 = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  )
);

function fixtureUrl(name: string) {
  return new URL(`../fixtures/uploads/${name}`, import.meta.url);
}

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(fixtureUrl(name)));
}

describe("isProbablyText", () => {
  it("accepts plain UTF-8", () => {
    expect(isProbablyText(Buffer.from("Hello, world!"))).toBe(true);
  });

  it("accepts BOM-prefixed UTF-16", () => {
    expect(isProbablyText(Uint8Array.from([0xff, 0xfe, 0x61, 0x00]))).toBe(
      true
    );
  });

  it("rejects an empty buffer", () => {
    expect(isProbablyText(new Uint8Array())).toBe(false);
  });

  it("rejects binary data containing null bytes", () => {
    expect(isProbablyText(Uint8Array.from([0x61, 0x00, 0x62]))).toBe(false);
  });

  it("rejects a buffer with too many control characters", () => {
    expect(
      isProbablyText(Uint8Array.from([0x01, 0x02, 0x03, 0x04, 0x05]))
    ).toBe(false);
  });
});

describe("detectFileKind", () => {
  it("detects a real PDF from its header", async () => {
    await expect(detectFileKind(await fixture("text.pdf"))).resolves.toBe("pdf");
  });

  it("detects an OOXML document", async () => {
    await expect(detectFileKind(await fixture("sample.docx"))).resolves.toBe(
      "docx"
    );
  });

  it("detects plain text only when no binary type matches", async () => {
    await expect(detectFileKind(Buffer.from("hello there"))).resolves.toBe(
      "txt"
    );
  });

  it("rejects a supported-looking image", async () => {
    await expect(detectFileKind(PNG_1X1)).rejects.toMatchObject({
      code: "UNSUPPORTED_TYPE",
    });
  });

  it("rejects a mismatched extension", () => {
    expect(() => assertKindMatchesName("pdf", "notes.docx")).toThrow(
      "contents don't match"
    );
    expect(() => assertKindMatchesName("txt", "notes.pdf")).toThrow(
      "contents don't match"
    );
    expect(() => assertKindMatchesName("pdf", "notes")).toThrow(
      "contents don't match"
    );
  });
});

describe("extractDocument", () => {
  it("extracts every page of a text PDF", async () => {
    const result = await extractDocument({
      bytes: await fixture("text.pdf"),
      originalName: "text.pdf",
    });

    expect(result.kind).toBe("pdf");
    expect(result.pageCount).toBe(2);
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]?.text).toContain("mitochondrion");
    expect(result.pages[1]?.text).toContain("photosynthesis");
  });

  it("accepts an uppercase extension", async () => {
    const result = await extractDocument({
      bytes: await fixture("text.pdf"),
      originalName: "TEXT.PDF",
    });

    expect(result.kind).toBe("pdf");
  });

  it("extracts DOCX sections split by an explicit page break", async () => {
    const result = await extractDocument({
      bytes: await fixture("sample.docx"),
      originalName: "sample.docx",
    });

    expect(result.kind).toBe("docx");
    expect(result.pageCount).toBe(2);
    expect(result.pages[0]?.text).toContain("cell structure");
    expect(result.pages[1]?.text).toContain("photosynthesis");
  });

  it("extracts PPTX slides in presentation order", async () => {
    const result = await extractDocument({
      bytes: await fixture("sample.pptx"),
      originalName: "sample.pptx",
    });

    expect(result.kind).toBe("pptx");
    expect(result.pageCount).toBe(3);
    expect(result.pages.map((page) => page.text)).toEqual([
      expect.stringContaining("water cycle"),
      expect.stringContaining("condensation"),
      expect.stringContaining("precipitation"),
    ]);
  });

  it("extracts TXT as a single page", async () => {
    const result = await extractDocument({
      bytes: await fixture("sample.txt"),
      originalName: "sample.txt",
    });

    expect(result.kind).toBe("txt");
    expect(result.pageCount).toBe(1);
    expect(result.pages[0]?.text).toContain("Photosynthesis");
  });

  it("rejects an empty file before type detection", async () => {
    await expect(
      extractDocument({
        bytes: await fixture("empty.txt"),
        originalName: "empty.txt",
      })
    ).rejects.toMatchObject({ code: "EMPTY_FILE" });
  });

  it("rejects a file above the size limit", async () => {
    await expect(
      extractDocument({
        bytes: new Uint8Array(MAX_UPLOAD_BYTES + 1),
        originalName: "big.txt",
      })
    ).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("rejects a scanned PDF with no selectable text", async () => {
    await expect(
      extractDocument({
        bytes: await fixture("scanned.pdf"),
        originalName: "scanned.pdf",
      })
    ).rejects.toMatchObject({ code: "NO_READABLE_TEXT" });
  });

  it("rejects a password-protected PDF", async () => {
    await expect(
      extractDocument({
        bytes: await fixture("encrypted.pdf"),
        originalName: "encrypted.pdf",
      })
    ).rejects.toMatchObject({ code: "PASSWORD_PROTECTED" });
  });

  it("rejects a PDF with too many pages", async () => {
    await expect(
      extractDocument({
        bytes: await fixture("too-many-pages.pdf"),
        originalName: "too-many-pages.pdf",
      })
    ).rejects.toMatchObject({
      code: "TOO_MANY_PAGES",
      message: expect.stringContaining("151"),
    });
  });

  it("rejects a corrupt PDF", async () => {
    await expect(
      extractDocument({
        bytes: await fixture("corrupt.pdf"),
        originalName: "corrupt.pdf",
      })
    ).rejects.toMatchObject({ code: "CORRUPT_FILE" });
  });

  it("rejects a text file renamed to .pdf", async () => {
    await expect(
      extractDocument({
        bytes: await fixture("spoofed.pdf"),
        originalName: "spoofed.pdf",
      })
    ).rejects.toMatchObject({ code: "TYPE_MISMATCH" });
  });

  it("rejects a PDF renamed to .docx", async () => {
    await expect(
      extractDocument({
        bytes: await fixture("text.pdf"),
        originalName: "text.docx",
      })
    ).rejects.toMatchObject({ code: "TYPE_MISMATCH" });
  });

  it("rejects an unsupported image", async () => {
    await expect(
      extractDocument({ bytes: PNG_1X1, originalName: "image.png" })
    ).rejects.toMatchObject({ code: "UNSUPPORTED_TYPE" });
  });

  it("uses a user-safe message for every failure", async () => {
    const error = await extractDocument({
      bytes: await fixture("scanned.pdf"),
      originalName: "scanned.pdf",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toMatch(/undefined|null|stack/i);
  });
});
