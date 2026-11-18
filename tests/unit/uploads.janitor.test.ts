import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    sourceFile: {
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@vercel/blob", () => ({
  del: vi.fn(),
  list: vi.fn(),
}));

import { db } from "@/lib/db";
import { del, list } from "@vercel/blob";
import { BLOB_PREFIX } from "@/features/uploads/constants";
import { runJanitor } from "@/features/uploads/services/janitor";

const findMany = vi.mocked(db.sourceFile.findMany);
const update = vi.mocked(db.sourceFile.update);
const deleteRow = vi.mocked(db.sourceFile.delete);
const delMock = vi.mocked(del);
const listMock = vi.mocked(list);

const NOW = new Date("2026-11-18T00:00:00.000Z");

function queueFindMany({
  pending = [],
  stale = [],
  unattached = [],
  tracked = [],
}: {
  pending?: Array<{ id: string; blobKey: string | null }>;
  stale?: Array<{ id: string; blobKey: string | null }>;
  unattached?: Array<{ id: string; blobKey: string | null }>;
  tracked?: Array<{ blobKey: string | null }>;
}) {
  findMany
    .mockResolvedValueOnce(pending as never)
    .mockResolvedValueOnce(stale as never)
    .mockResolvedValueOnce(unattached as never)
    .mockResolvedValueOnce(tracked as never);
}

function emptyList() {
  listMock.mockResolvedValue({
    blobs: [],
    hasMore: false,
    cursor: undefined,
  } as never);
}

describe("runJanitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue({} as never);
    deleteRow.mockResolvedValue({} as never);
    delMock.mockResolvedValue(undefined as never);
    emptyList();
  });

  it("does nothing when there is nothing to reconcile", async () => {
    queueFindMany({});

    const result = await runJanitor(NOW);

    expect(result).toEqual({
      staleSourcesFailed: 0,
      orphanBlobsDeleted: 0,
      blobDeletesRetried: 0,
      unattachedSourcesDeleted: 0,
      errors: [],
    });
    expect(delMock).not.toHaveBeenCalled();
    expect(deleteRow).not.toHaveBeenCalled();
    expect(listMock).toHaveBeenCalledWith({
      prefix: BLOB_PREFIX,
      cursor: undefined,
      limit: 1000,
    });
  });

  it("retries failed deletes, fails stale rows, and removes unattached sources", async () => {
    queueFindMany({
      pending: [{ id: "p1", blobKey: "sources/u/p1" }],
      stale: [{ id: "s1", blobKey: "sources/u/s1" }],
      unattached: [{ id: "u1", blobKey: "sources/u/u1" }],
      tracked: [{ blobKey: "sources/u/keep" }],
    });
    listMock.mockResolvedValue({
      blobs: [
        { pathname: "sources/u/keep" },
        { pathname: "sources/u/orphan" },
      ],
      hasMore: false,
      cursor: undefined,
    } as never);

    const result = await runJanitor(NOW);

    expect(result).toMatchObject({
      blobDeletesRetried: 1,
      staleSourcesFailed: 1,
      unattachedSourcesDeleted: 1,
      orphanBlobsDeleted: 1,
      errors: [],
    });
    expect(delMock).toHaveBeenNthCalledWith(1, "sources/u/p1");
    expect(delMock).toHaveBeenNthCalledWith(2, "sources/u/s1");
    expect(delMock).toHaveBeenNthCalledWith(3, "sources/u/u1");
    expect(delMock).toHaveBeenNthCalledWith(4, ["sources/u/orphan"]);
    expect(update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { blobKey: null, blobDeleteFailedAt: null },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: expect.objectContaining({
        status: "FAILED",
        errorReason: expect.stringContaining("interrupted"),
      }),
    });
    expect(deleteRow).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("records a failed blob delete and keeps the key for the next run", async () => {
    queueFindMany({ pending: [{ id: "p1", blobKey: "sources/u/p1" }] });
    delMock.mockRejectedValueOnce(new Error("storage offline"));

    const result = await runJanitor(NOW);

    expect(result.blobDeletesRetried).toBe(0);
    expect(result.errors).toEqual([
      "delete p1: storage offline",
    ]);
    expect(update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { blobDeleteFailedAt: NOW },
    });
  });

  it("continues past a stale row whose status update fails", async () => {
    queueFindMany({
      stale: [
        { id: "s1", blobKey: "sources/u/s1" },
        { id: "s2", blobKey: "sources/u/s2" },
      ],
    });
    update
      .mockRejectedValueOnce(new Error("db down"))
      .mockResolvedValue({} as never);

    const result = await runJanitor(NOW);

    expect(result.staleSourcesFailed).toBe(1);
    expect(result.errors).toEqual(["stale s1: db down"]);
    // The first row never reached deletion; the second one did.
    expect(delMock).toHaveBeenCalledTimes(1);
    expect(delMock).toHaveBeenCalledWith("sources/u/s2");
  });

  it("removes an unattached row even when its blob delete fails", async () => {
    queueFindMany({
      unattached: [{ id: "u1", blobKey: "sources/u/u1" }],
    });
    delMock.mockRejectedValueOnce(new Error("storage offline"));

    const result = await runJanitor(NOW);

    expect(result.unattachedSourcesDeleted).toBe(1);
    expect(result.errors).toEqual([]);
    expect(deleteRow).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("records a failure to delete orphan blobs", async () => {
    queueFindMany({});
    listMock.mockResolvedValue({
      blobs: [{ pathname: "sources/u/orphan" }],
      hasMore: false,
      cursor: undefined,
    } as never);
    delMock.mockRejectedValueOnce(new Error("storage offline"));

    const result = await runJanitor(NOW);

    expect(result.orphanBlobsDeleted).toBe(0);
    expect(result.errors).toEqual(["orphans: storage offline"]);
  });

  it("records a failure to list the blob store", async () => {
    queueFindMany({});
    listMock.mockRejectedValueOnce(new Error("no token"));

    const result = await runJanitor(NOW);

    expect(result.errors).toEqual(["orphan scan: no token"]);
  });

  it("follows pagination cursors across the blob store", async () => {
    queueFindMany({});
    listMock
      .mockResolvedValueOnce({
        blobs: [{ pathname: "sources/u/orphan-1" }],
        hasMore: true,
        cursor: "page-2",
      } as never)
      .mockResolvedValueOnce({
        blobs: [{ pathname: "sources/u/orphan-2" }],
        hasMore: false,
        cursor: undefined,
      } as never);

    const result = await runJanitor(NOW);

    expect(listMock).toHaveBeenCalledTimes(2);
    expect(listMock).toHaveBeenNthCalledWith(2, {
      prefix: BLOB_PREFIX,
      cursor: "page-2",
      limit: 1000,
    });
    expect(result.orphanBlobsDeleted).toBe(2);
  });

  it("never reports a negative or missing error message", async () => {
    queueFindMany({ pending: [{ id: "p1", blobKey: "sources/u/p1" }] });
    delMock.mockRejectedValueOnce("plain string failure");

    const result = await runJanitor(NOW);

    expect(result.errors).toEqual(["delete p1: plain string failure"]);
  });
});
