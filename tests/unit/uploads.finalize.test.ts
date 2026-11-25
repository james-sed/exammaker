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
  head: vi.fn(),
  del: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
}));

vi.mock("@/features/uploads/services/extractSourceFile", () => ({
  runExtraction: vi.fn(),
}));

import { db } from "@/lib/db";
import { del, head } from "@vercel/blob";
import { runExtraction } from "@/features/uploads/services/extractSourceFile";
import {
  finalizeUpload,
  retryExtraction,
} from "@/features/uploads/services/finalizeUpload";

const findFirst = vi.mocked(db.sourceFile.findFirst);
const findUnique = vi.mocked(db.sourceFile.findUnique);
const update = vi.mocked(db.sourceFile.update);
const updateMany = vi.mocked(db.sourceFile.updateMany);
const headMock = vi.mocked(head);
const delMock = vi.mocked(del);
const runExtractionMock = vi.mocked(runExtraction);

const OWNER = "user_1";
const PATHNAME = "sources/user_1/123e4567-e89b-12d3-a456-426614174000";
const SIZE = 1_024;

interface RowOverrides {
  status?: string;
  blobKey?: string | null;
  updatedAt?: Date;
  sizeBytes?: number;
  pageCount?: number | null;
  charCount?: number | null;
}

function row(overrides: RowOverrides = {}) {
  return {
    id: "sf_1",
    originalName: "notes.pdf",
    mimeType: "application/pdf",
    sizeBytes: SIZE,
    status: "UPLOADED",
    errorReason: null,
    pageCount: null,
    charCount: null,
    quizId: null,
    blobPathname: PATHNAME,
    blobKey: PATHNAME,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date(),
    ...overrides,
  };
}

function summary(overrides: Record<string, unknown> = {}) {
  return {
    ...row(),
    status: "READY",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    canRetry: false,
    ...overrides,
  };
}

describe("finalizeUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delMock.mockResolvedValue(undefined as never);
    headMock.mockResolvedValue({
      pathname: PATHNAME,
      size: SIZE,
      url: `https://store.private.blob.vercel-storage.com/${PATHNAME}`,
    } as never);
    runExtractionMock.mockResolvedValue({
      state: "ready",
      sourceFile: summary(),
    } as never);
    update.mockResolvedValue(row() as never);
    findUnique.mockResolvedValue(row() as never);
  });

  it("returns not_found when the pathname is not owned", async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      finalizeUpload({ ownerId: OWNER, pathname: PATHNAME })
    ).resolves.toEqual({ kind: "not_found" });
    expect(headMock).not.toHaveBeenCalled();
  });

  it("does no work for a source that is already ready", async () => {
    findFirst.mockResolvedValue(row({ status: "READY" }) as never);

    const outcome = await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.result.inProgress).toBe(false);
      expect(outcome.result.sourceFile.status).toBe("READY");
    }
    expect(headMock).not.toHaveBeenCalled();
    expect(runExtractionMock).not.toHaveBeenCalled();
  });

  it("does no work for a source that already failed", async () => {
    findFirst.mockResolvedValue(row({ status: "FAILED" }) as never);

    const outcome = await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(outcome.kind === "ok" && outcome.result.inProgress).toBe(false);
    expect(headMock).not.toHaveBeenCalled();
  });

  it("returns the finished source when finalize repeats after the binary is gone", async () => {
    findFirst.mockResolvedValue(
      row({ status: "READY", blobKey: null, pageCount: 2, charCount: 154 }) as never
    );

    const outcome = await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.result.sourceFile.id).toBe("sf_1");
      expect(outcome.result.sourceFile.status).toBe("READY");
      expect(outcome.result.sourceFile.pageCount).toBe(2);
      expect(outcome.result.inProgress).toBe(false);
    }
    expect(findFirst).toHaveBeenCalledWith({
      where: { blobPathname: PATHNAME, ownerId: OWNER },
    });
    expect(headMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
    expect(runExtractionMock).not.toHaveBeenCalled();
  });

  it("reports a fresh extraction as in progress", async () => {
    findFirst.mockResolvedValue(
      row({ status: "EXTRACTING", updatedAt: new Date() }) as never
    );

    const outcome = await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(outcome.kind === "ok" && outcome.result.inProgress).toBe(true);
    expect(headMock).not.toHaveBeenCalled();
    expect(runExtractionMock).not.toHaveBeenCalled();
  });

  it("reclaims an extraction whose heartbeat is stale", async () => {
    findFirst.mockResolvedValue(
      row({
        status: "EXTRACTING",
        updatedAt: new Date(Date.now() - 20 * 60 * 1000),
      }) as never
    );

    await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(headMock).toHaveBeenCalledWith(PATHNAME);
    expect(runExtractionMock).toHaveBeenCalledWith({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });
  });

  it("marks the upload failed when the blob is missing", async () => {
    findFirst.mockResolvedValue(row() as never);
    headMock.mockRejectedValue(new Error("not found"));
    updateMany.mockResolvedValue({ count: 1 } as never);
    findUnique.mockResolvedValue(
      row({ status: "FAILED", blobKey: null }) as never
    );

    const outcome = await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sf_1", ownerId: OWNER, status: "UPLOADED" },
        data: expect.objectContaining({
          status: "FAILED",
          errorReason: expect.stringContaining("couldn't find"),
        }),
      })
    );
    expect(delMock).toHaveBeenCalledWith(PATHNAME);
    expect(runExtractionMock).not.toHaveBeenCalled();
    expect(outcome.kind === "ok" && outcome.result.sourceFile.status).toBe(
      "FAILED"
    );
  });

  it("marks the upload failed when the stored size does not match", async () => {
    findFirst.mockResolvedValue(row() as never);
    headMock.mockResolvedValue({
      pathname: PATHNAME,
      size: SIZE + 1,
      url: `https://store.private.blob.vercel-storage.com/${PATHNAME}`,
    } as never);
    updateMany.mockResolvedValue({ count: 1 } as never);
    findUnique.mockResolvedValue(
      row({ status: "FAILED", blobKey: null }) as never
    );

    await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorReason: expect.stringContaining("didn't finish correctly"),
        }),
      })
    );
    expect(runExtractionMock).not.toHaveBeenCalled();
  });

  it("marks the upload failed when the blob is public", async () => {
    findFirst.mockResolvedValue(row() as never);
    headMock.mockResolvedValue({
      pathname: PATHNAME,
      size: SIZE,
      url: `https://store.public.blob.vercel-storage.com/${PATHNAME}`,
    } as never);
    updateMany.mockResolvedValue({ count: 1 } as never);
    findUnique.mockResolvedValue(
      row({ status: "FAILED", blobKey: null }) as never
    );

    await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorReason: expect.stringContaining("wasn't stored privately"),
        }),
      })
    );
    expect(delMock).toHaveBeenCalledWith(PATHNAME);
    expect(runExtractionMock).not.toHaveBeenCalled();
  });

  it("treats a malformed blob URL as unverifiable", async () => {
    findFirst.mockResolvedValue(row() as never);
    headMock.mockResolvedValue({
      pathname: PATHNAME,
      size: SIZE,
      url: "not a url",
    } as never);
    updateMany.mockResolvedValue({ count: 1 } as never);
    findUnique.mockResolvedValue(
      row({ status: "FAILED", blobKey: null }) as never
    );

    await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(runExtractionMock).not.toHaveBeenCalled();
    expect(delMock).toHaveBeenCalledWith(PATHNAME);
  });

  it("keeps the blob path when deleting an unverified upload fails", async () => {
    findFirst.mockResolvedValue(row() as never);
    headMock.mockRejectedValue(new Error("not found"));
    updateMany.mockResolvedValue({ count: 1 } as never);
    delMock.mockRejectedValue(new Error("blob is down"));
    update.mockResolvedValue(
      row({ status: "FAILED", blobKey: PATHNAME }) as never
    );
    findUnique.mockResolvedValue(
      row({ status: "FAILED", blobKey: PATHNAME }) as never
    );

    await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(update).toHaveBeenCalledWith({
      where: { id: "sf_1" },
      data: { blobDeleteFailedAt: expect.any(Date) },
    });
  });

  it("does not claim a row another caller is already failing", async () => {
    findFirst.mockResolvedValue(row() as never);
    headMock.mockRejectedValue(new Error("not found"));
    updateMany.mockResolvedValue({ count: 0 } as never);
    findUnique.mockResolvedValue(row({ status: "FAILED" }) as never);

    await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(delMock).not.toHaveBeenCalled();
  });

  it("runs extraction once the upload is verified", async () => {
    findFirst.mockResolvedValue(row() as never);

    const outcome = await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(runExtractionMock).toHaveBeenCalledWith({
      sourceFileId: "sf_1",
      ownerId: OWNER,
    });
    expect(outcome).toEqual({
      kind: "ok",
      result: { sourceFile: summary(), inProgress: false },
    });
  });

  it("reports in progress when the extraction claim was lost", async () => {
    findFirst.mockResolvedValue(row() as never);
    runExtractionMock.mockResolvedValue({
      state: "in_progress",
      sourceFile: summary({ status: "EXTRACTING" }),
    } as never);

    const outcome = await finalizeUpload({ ownerId: OWNER, pathname: PATHNAME });

    expect(outcome.kind === "ok" && outcome.result.inProgress).toBe(true);
  });

  it("returns not_found when the row disappears during extraction", async () => {
    findFirst.mockResolvedValue(row() as never);
    runExtractionMock.mockResolvedValue(null as never);

    await expect(
      finalizeUpload({ ownerId: OWNER, pathname: PATHNAME })
    ).resolves.toEqual({ kind: "not_found" });
  });
});

describe("retryExtraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runExtractionMock.mockResolvedValue({
      state: "ready",
      sourceFile: summary(),
    } as never);
  });

  it("returns not_found for a source the user does not own", async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      retryExtraction({ ownerId: OWNER, sourceFileId: "sf_1" })
    ).resolves.toEqual({ kind: "not_found" });
    expect(runExtractionMock).not.toHaveBeenCalled();
  });

  it("does not retry a failed source whose blob is gone", async () => {
    findFirst.mockResolvedValue(
      row({ status: "FAILED", blobKey: null }) as never
    );

    const outcome = await retryExtraction({
      ownerId: OWNER,
      sourceFileId: "sf_1",
    });

    expect(outcome.kind === "ok" && outcome.result.inProgress).toBe(false);
    expect(runExtractionMock).not.toHaveBeenCalled();
  });

  it("reports a running source as in progress", async () => {
    findFirst.mockResolvedValue(row({ status: "EXTRACTING" }) as never);

    const outcome = await retryExtraction({
      ownerId: OWNER,
      sourceFileId: "sf_1",
    });

    expect(outcome.kind === "ok" && outcome.result.inProgress).toBe(true);
    expect(runExtractionMock).not.toHaveBeenCalled();
  });

  it("retries a failed source that still has a blob", async () => {
    findFirst.mockResolvedValue(
      row({ status: "FAILED", blobKey: PATHNAME }) as never
    );

    await retryExtraction({ ownerId: OWNER, sourceFileId: "sf_1" });

    expect(runExtractionMock).toHaveBeenCalledWith({
      sourceFileId: "sf_1",
      ownerId: OWNER,
      retryFailed: true,
    });
  });

  it("returns not_found when the retry loses the row", async () => {
    findFirst.mockResolvedValue(
      row({ status: "FAILED", blobKey: PATHNAME }) as never
    );
    runExtractionMock.mockResolvedValue(null as never);

    await expect(
      retryExtraction({ ownerId: OWNER, sourceFileId: "sf_1" })
    ).resolves.toEqual({ kind: "not_found" });
  });
});
