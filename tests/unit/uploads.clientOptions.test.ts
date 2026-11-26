import { describe, expect, it, vi } from "vitest";
import { buildClientUploadOptions } from "@/features/uploads/clientUploadOptions";

function makeInput(overrides: Partial<Parameters<typeof buildClientUploadOptions>[0]> = {}) {
  return {
    mimeType: "application/pdf" as const,
    fileName: "notes.pdf",
    sizeBytes: 4_096,
    abortSignal: new AbortController().signal,
    onProgress: () => {},
    ...overrides,
  };
}

describe("buildClientUploadOptions", () => {
  it("sends the extension-derived type instead of letting Blob infer octet-stream", () => {
    const options = buildClientUploadOptions(makeInput());

    expect(options.contentType).toBe("application/pdf");
    expect(options.contentType).not.toBe("application/octet-stream");
  });

  it("keeps the canonical type for every accepted upload type", () => {
    const cases = [
      ["notes.pdf", "application/pdf"],
      [
        "notes.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      [
        "notes.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ],
      ["notes.txt", "text/plain"],
    ] as const;

    for (const [fileName, mimeType] of cases) {
      const options = buildClientUploadOptions(
        makeInput({ fileName, mimeType })
      );

      expect(options.contentType).toBe(mimeType);
    }
  });

  it("passes the file details to the token route", () => {
    const options = buildClientUploadOptions(makeInput());

    expect(JSON.parse(options.clientPayload as string)).toEqual({
      name: "notes.pdf",
      type: "application/pdf",
      size: 4_096,
    });
  });

  it("rounds progress percentages for the progress bar", () => {
    const onProgress = vi.fn();
    const options = buildClientUploadOptions(makeInput({ onProgress }));

    options.onUploadProgress?.({
      loaded: 1,
      total: 3,
      percentage: 33.6,
    });

    expect(onProgress).toHaveBeenCalledWith(34);
  });

  it("forwards the abort signal so a cancel stops the transfer", () => {
    const controller = new AbortController();

    const options = buildClientUploadOptions(
      makeInput({ abortSignal: controller.signal })
    );

    expect(options.abortSignal).toBe(controller.signal);
  });
});
