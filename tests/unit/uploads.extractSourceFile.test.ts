import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    sourceFile: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@vercel/blob", () => ({
  get: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@/features/uploads/services/extractDocument", () => ({
  extractDocument: vi.fn(),
}));

import { db } from "@/lib/db";
import { del, get } from "@vercel/blob";
import { MAX_EXTRACTED_CHARACTERS } from "@/features/uploads/constants";
import { extractDocument } from "@/features/uploads/services/extractDocument";
import { ExtractionError } from "@/features/uploads/services/extractionErrors";
import { runExtraction } from "@/features/uploads/services/extractSourceFile";

const findFirst = vi.mocked(db.sourceFile.findFirst);
const findUnique = vi.mocked(db.sourceFile.findUnique);
const update = vi.mocked(db.sourceFile.update);
const updateMany = vi.mocked(db.sourceFile.updateMany);
const getMock = vi.mocked(get);
const delMock = vi.mocked(del);
const extractMock = vi.mocked(extractDocument);

const OWNER = "user_1";
const BLOB_KEY = "sources/user_1/123e4567-e89b-12d3-a456-426614174000";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "sf_1",
    originalName: "notes.txt",
    mimeType: "text/plain",
    sizeBytes: 128,
    status: "EXTRACTING",
    errorReason: null,
    pageCount: null,
    charCount: null,
    quizId: null,
    blobKey: BLOB_KEY,
    blobDeleteFailedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function blobResponse() {
  return {
    statusCode: 200,
    stream: new Response("file bytes").body,
  } as never;
}

function extracted(text: string, pageCount = 1) {
  return {
    kind: "txt",
    pages: [{ index: 1, text }],
    pageCount,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  updateMany.mockResolvedValue({ count: 1 } as never);
  findFirst.mockResolvedValue(row() as never);
  findUnique.mockResolvedValue(null as never);
  update.mockResolvedValue(row({ status: "READY", blobKey: null }) as never);
  getMock.mockResolvedValue(blobResponse());
  delMock.mockResolvedValue(undefined as never);
  extractMock.mockResolvedValue(extracted("Hello world."));
});

describe("runExtraction claims", () => {
  it("returns ready when another caller already finished", async () => {
    updateMany.mockResolvedValue({ count: 0 } as never);
    findFirst.mockResolvedValue(row({ status: "READY" }) as never);

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome).toMatchObject({
      state: "ready",
      sourceFile: { id: "sf_1", status: "READY" },
    });
    expect(getMock).not.toHaveBeenCalled();
  });

  it("returns failed when another caller already failed it", async () => {
    updateMany.mockResolvedValue({ count: 0 } as never);
    findFirst.mockResolvedValue(row({ status: "FAILED" }) as never);

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome?.state).toBe("failed");
  });

  it("returns in_progress when another caller holds a fresh claim", async () => {
    updateMany.mockResolvedValue({ count: 0 } as never);
    findFirst.mockResolvedValue(row({ status: "EXTRACTING" }) as never);

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome?.state).toBe("in_progress");
  });

  it("returns null when the row is gone or not owned", async () => {
    updateMany.mockResolvedValue({ count: 0 } as never);
    findFirst.mockResolvedValue(null);

    await expect(
      runExtraction({ sourceFileId: "sf_1", ownerId: OWNER })
    ).resolves.toBeNull();
  });

  it("adds a failed-row condition only for an explicit retry", async () => {
    await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
      retryFailed: true,
    });

    const where = updateMany.mock.calls[0]?.[0]?.where as {
      OR: Array<Record<string, unknown>>;
    };

    expect(where.OR).toContainEqual({
      status: "FAILED",
      blobKey: { not: null },
    });
  });
});

describe("runExtraction failures", () => {
  it("fails the source when no blob key is stored", async () => {
    findFirst.mockResolvedValue(row({ blobKey: null }) as never);
    update.mockResolvedValue(row({ status: "FAILED" }) as never);

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome?.state).toBe("failed");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorReason: expect.stringContaining("went wrong"),
        }),
      })
    );
    expect(getMock).not.toHaveBeenCalled();
  });

  it("fails the source when the blob cannot be read", async () => {
    getMock.mockResolvedValue({ statusCode: 404, stream: null } as never);

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome?.state).toBe("failed");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorReason: expect.stringContaining("upload it again"),
        }),
      })
    );
    expect(delMock).toHaveBeenCalledWith(BLOB_KEY);
  });

  it("fails the source when the blob read throws", async () => {
    getMock.mockRejectedValue(new Error("network"));

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome?.state).toBe("failed");
    expect(extractMock).not.toHaveBeenCalled();
  });

  it("uses the extraction error message when a parser rejects the file", async () => {
    extractMock.mockRejectedValue(
      new ExtractionError("NO_READABLE_TEXT", "no readable text")
    );

    await runExtraction({ sourceFileId: "sf_1", ownerId: OWNER });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorReason: "no readable text",
        }),
      })
    );
    expect(delMock).toHaveBeenCalledWith(BLOB_KEY);
  });

  it("uses a generic message for unexpected parser errors", async () => {
    extractMock.mockRejectedValue(new Error("boom"));

    await runExtraction({ sourceFileId: "sf_1", ownerId: OWNER });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorReason: expect.stringContaining("went wrong"),
        }),
      })
    );
  });

  it("fails a document whose text sanitizes away to nothing", async () => {
    extractMock.mockResolvedValue(
      { kind: "txt", pages: [{ index: 1, text: " \u0000 " }], pageCount: 1 } as never
    );

    await runExtraction({ sourceFileId: "sf_1", ownerId: OWNER });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorReason: expect.stringContaining("no readable text"),
        }),
      })
    );
  });

  it("fails a document above the character limit", async () => {
    extractMock.mockResolvedValue(
      extracted("x".repeat(MAX_EXTRACTED_CHARACTERS + 1))
    );

    await runExtraction({ sourceFileId: "sf_1", ownerId: OWNER });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorReason: expect.stringContaining("characters of text"),
        }),
      })
    );
  });
});

describe("runExtraction success", () => {
  it("saves sanitized text before deleting the binary", async () => {
    extractMock.mockResolvedValue(
      {
        kind: "pdf",
        pages: [
          { index: 1, text: "  First page.  " },
          { index: 2, text: "Second page." },
        ],
        pageCount: 2,
      } as never
    );
    update
      .mockResolvedValueOnce(
        row({
          status: "READY",
          pageCount: 2,
          charCount: 25,
          mimeType: "application/pdf",
        }) as never
      )
      .mockResolvedValueOnce(
        row({
          status: "READY",
          blobKey: null,
          pageCount: 2,
          charCount: 25,
          mimeType: "application/pdf",
        }) as never
      );

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome?.state).toBe("ready");
    expect(update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          status: "READY",
          extractedText: "First page.\n\nSecond page.",
          pages: [
            { index: 1, text: "First page." },
            { index: 2, text: "Second page." },
          ],
          pageCount: 2,
          charCount: 25,
          mimeType: "application/pdf",
        }),
      })
    );

    expect(update.mock.invocationCallOrder[0]).toBeLessThan(
      delMock.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
    );
    expect(delMock).toHaveBeenCalledWith(BLOB_KEY);
    expect(outcome?.sourceFile.status).toBe("READY");
  });

  it("keeps the blob key when deleting the binary fails", async () => {
    delMock.mockRejectedValue(new Error("storage offline"));
    update
      .mockResolvedValueOnce(row({ status: "READY", blobKey: BLOB_KEY }) as never)
      .mockResolvedValueOnce(
        row({ status: "READY", blobKey: BLOB_KEY }) as never
      );

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome?.state).toBe("ready");
    expect(update).toHaveBeenLastCalledWith({
      where: { id: "sf_1" },
      data: { blobDeleteFailedAt: expect.any(Date) },
    });
  });

  it("reports a failed delete of a failed extraction", async () => {
    findFirst.mockResolvedValue(
      row({ blobKey: BLOB_KEY, status: "EXTRACTING" }) as never
    );
    extractMock.mockRejectedValue(
      new ExtractionError("CORRUPT_FILE", "bad file")
    );
    update
      .mockResolvedValueOnce(row({ status: "FAILED", blobKey: BLOB_KEY }) as never)
      .mockResolvedValueOnce(
        row({ status: "FAILED", blobKey: BLOB_KEY }) as never
      );
    delMock.mockRejectedValue(new Error("storage offline"));

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome?.state).toBe("failed");
    expect(update).toHaveBeenLastCalledWith({
      where: { id: "sf_1" },
      data: { blobDeleteFailedAt: expect.any(Date) },
    });
  });

  it("returns the refreshed row after a successful delete", async () => {
    update
      .mockResolvedValueOnce(row({ status: "READY" }) as never)
      .mockResolvedValueOnce(row({ status: "READY", blobKey: null }) as never);

    const outcome = await runExtraction({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });

    expect(outcome?.sourceFile).toMatchObject({ id: "sf_1", status: "READY" });
  });
});
