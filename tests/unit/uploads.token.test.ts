import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    sourceFile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { MAX_UPLOAD_BYTES } from "@/features/uploads/constants";
import {
  ensureSourceFileForUpload,
  UploadTokenError,
} from "@/features/uploads/services/issueUploadToken";

const findUnique = vi.mocked(db.sourceFile.findUnique);
const create = vi.mocked(db.sourceFile.create);
const update = vi.mocked(db.sourceFile.update);

const USER_ID = "user_1";
const PATHNAME = "sources/user_1/123e4567-e89b-12d3-a456-426614174000";

function payload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    name: "notes.pdf",
    type: "application/pdf",
    size: 4_096,
    ...overrides,
  });
}

function makeInput(overrides: Partial<Parameters<typeof ensureSourceFileForUpload>[0]> = {}) {
  return {
    userId: USER_ID,
    pathname: PATHNAME,
    clientPayload: payload(),
    ...overrides,
  };
}

describe("ensureSourceFileForUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "sf_1" } as never);
    update.mockResolvedValue({ id: "sf_1" } as never);
  });

  it("creates an upload row before the binary is sent", async () => {
    const result = await ensureSourceFileForUpload(makeInput());

    expect(result).toEqual({ sourceFileId: "sf_1" });
    expect(create).toHaveBeenCalledWith({
      data: {
        ownerId: USER_ID,
        originalName: "notes.pdf",
        mimeType: "application/pdf",
        sizeBytes: 4_096,
        blobPathname: PATHNAME,
        blobKey: PATHNAME,
        status: "UPLOADED",
      },
      select: { id: true },
    });
  });

  it("normalizes the declared type from the extension", async () => {
    await ensureSourceFileForUpload(
      makeInput({
        clientPayload: payload({
          name: "notes.txt",
          type: "application/octet-stream",
        }),
      })
    );

    const data = create.mock.calls[0]?.[0]?.data;
    expect(data?.mimeType).toBe("text/plain");
  });

  it("accepts a payload without a declared type", async () => {
    await ensureSourceFileForUpload(
      makeInput({ clientPayload: payload({ type: null }) })
    );

    const data = create.mock.calls[0]?.[0]?.data;
    expect(data?.mimeType).toBe("application/pdf");
  });

  it("reuses an existing row for the same owner and upload", async () => {
    findUnique.mockResolvedValue({
      id: "sf_existing",
      ownerId: USER_ID,
      status: "UPLOADED",
    } as never);

    const result = await ensureSourceFileForUpload(
      makeInput({ clientPayload: payload({ size: 9_999 }) })
    );

    expect(result).toEqual({ sourceFileId: "sf_existing" });
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: "sf_existing" },
      data: {
        originalName: "notes.pdf",
        mimeType: "application/pdf",
        sizeBytes: 9_999,
      },
    });
  });

  it("rejects a row owned by another user", async () => {
    findUnique.mockResolvedValue({
      id: "sf_existing",
      ownerId: "someone_else",
      status: "UPLOADED",
    } as never);

    await expect(ensureSourceFileForUpload(makeInput())).rejects.toBeInstanceOf(
      UploadTokenError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an upload that was already processed", async () => {
    findUnique.mockResolvedValue({
      id: "sf_existing",
      ownerId: USER_ID,
      status: "READY",
    } as never);

    await expect(ensureSourceFileForUpload(makeInput())).rejects.toThrow(
      "already been processed"
    );
  });

  it.each([
    ["another user's prefix", "sources/other_1/123e4567-e89b-12d3-a456-426614174000"],
    ["a traversal attempt", "sources/user_1/../../123e4567-e89b"],
    ["no prefix", "123e4567-e89b-12d3-a456-426614174000"],
    ["a nested path", `sources/user_1/${"a".repeat(8)}/extra`],
  ])("rejects a pathname with %s", async (_label, pathname) => {
    await expect(
      ensureSourceFileForUpload(makeInput({ pathname }))
    ).rejects.toBeInstanceOf(UploadTokenError);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a missing client payload", async () => {
    await expect(
      ensureSourceFileForUpload(makeInput({ clientPayload: null }))
    ).rejects.toThrow("Upload details are missing");
  });

  it("rejects malformed client payload JSON", async () => {
    await expect(
      ensureSourceFileForUpload(makeInput({ clientPayload: "{not json" }))
    ).rejects.toThrow("Upload details are invalid");
  });

  it.each([
    ["a missing name", { name: undefined }],
    ["a blank name", { name: "   " }],
    ["a negative size", { size: -1 }],
    ["a fractional size", { size: 1.5 }],
    ["a size above the limit", { size: MAX_UPLOAD_BYTES + 1 }],
  ])("rejects %s", async (_label, overrides) => {
    await expect(
      ensureSourceFileForUpload(
        makeInput({ clientPayload: payload(overrides) })
      )
    ).rejects.toThrow("Upload details are invalid");
  });

  it("rejects an unsupported extension", async () => {
    await expect(
      ensureSourceFileForUpload(
        makeInput({ clientPayload: payload({ name: "malware.exe" }) })
      )
    ).rejects.toThrow("Only PDF, DOCX, PPTX, and TXT files are supported");
  });

  it("accepts every supported extension", async () => {
    for (const name of [
      "notes.pdf",
      "notes.docx",
      "notes.pptx",
      "notes.txt",
    ]) {
      create.mockClear();

      await expect(
        ensureSourceFileForUpload(
          makeInput({ clientPayload: payload({ name, type: null }) })
        )
      ).resolves.toEqual({ sourceFileId: "sf_1" });
    }
  });
});
