import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    sourceFile: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import {
  getOwnedSourceFileDetail,
  getOwnedSourceFileSummary,
  listOwnedSourceFiles,
} from "@/features/uploads/queries/sourceFileQueries";

const findMany = vi.mocked(db.sourceFile.findMany);
const findFirst = vi.mocked(db.sourceFile.findFirst);

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "sf_1",
    originalName: "notes.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2_048,
    status: "READY",
    errorReason: null,
    pageCount: 2,
    charCount: 40,
    quizId: null,
    blobKey: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

describe("listOwnedSourceFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists only the owner's sources, newest first", async () => {
    findMany.mockResolvedValue([
      row(),
      row({
        id: "sf_2",
        status: "FAILED",
        blobKey: "sources/u/sf_2",
      }),
    ] as never);

    const sources = await listOwnedSourceFiles("user_1", 5);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: "user_1" },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    );
    expect(sources).toHaveLength(2);
    expect(sources[0]).toMatchObject({
      id: "sf_1",
      status: "READY",
      canRetry: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(sources[1]).toMatchObject({
      id: "sf_2",
      status: "FAILED",
      canRetry: true,
    });
  });
});

describe("getOwnedSourceFileSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the source is missing or not owned", async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      getOwnedSourceFileSummary("sf_1", "user_1")
    ).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "sf_1", ownerId: "user_1" },
      select: expect.any(Object),
    });
  });

  it("maps a stored row to a summary", async () => {
    findFirst.mockResolvedValue(row() as never);

    await expect(
      getOwnedSourceFileSummary("sf_1", "user_1")
    ).resolves.toMatchObject({
      id: "sf_1",
      originalName: "notes.pdf",
      sizeBytes: 2_048,
    });
  });
});

describe("getOwnedSourceFileDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the source is missing", async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      getOwnedSourceFileDetail("sf_1", "user_1")
    ).resolves.toBeNull();
  });

  it("builds chunks from stored page text", async () => {
    findFirst.mockResolvedValue(
      row({
        extractedText: "First page. Second page.",
        pages: [
          { index: 1, text: "First page." },
          { index: 2, text: "Second page." },
        ],
      }) as never
    );

    const detail = await getOwnedSourceFileDetail("sf_1", "user_1");

    expect(detail?.pages).toEqual([
      { index: 1, text: "First page." },
      { index: 2, text: "Second page." },
    ]);
    expect(detail?.chunks.length).toBeGreaterThan(0);
    expect(detail?.chunks[0]?.pageStart).toBe(1);
    expect(detail?.chunks.at(-1)?.pageEnd).toBe(2);
  });

  it("falls back to the flat text when pages are not stored", async () => {
    findFirst.mockResolvedValue(
      row({ extractedText: "Only flat text.", pages: null }) as never
    );

    const detail = await getOwnedSourceFileDetail("sf_1", "user_1");

    expect(detail?.pages).toEqual([{ index: 1, text: "Only flat text." }]);
    expect(detail?.chunks).toHaveLength(1);
  });

  it("filters malformed page entries", async () => {
    findFirst.mockResolvedValue(
      row({
        pages: [
          { index: 3, text: "Valid page." },
          { index: "not a number", text: "bad" },
          { index: 4 },
        ],
      }) as never
    );

    const detail = await getOwnedSourceFileDetail("sf_1", "user_1");

    expect(detail?.pages).toEqual([{ index: 3, text: "Valid page." }]);
  });

  it("returns an empty preview when no text was stored", async () => {
    findFirst.mockResolvedValue(
      row({ extractedText: null, pages: null }) as never
    );

    const detail = await getOwnedSourceFileDetail("sf_1", "user_1");

    expect(detail?.pages).toBeNull();
    expect(detail?.chunks).toEqual([]);
  });
});
