import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class UploadTokenError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "UploadTokenError";
    }
  }

  return {
    auth: vi.fn(),
    handleUpload: vi.fn(),
    ensureSourceFileForUpload: vi.fn(),
    UploadTokenError,
    finalizeUpload: vi.fn(),
    retryExtraction: vi.fn(),
    listOwnedSourceFiles: vi.fn(),
    getOwnedSourceFileDetail: vi.fn(),
    runJanitor: vi.fn(),
  };
});

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@vercel/blob/client", () => ({ handleUpload: mocks.handleUpload }));
vi.mock("@/features/uploads/services/issueUploadToken", () => ({
  ensureSourceFileForUpload: mocks.ensureSourceFileForUpload,
  UploadTokenError: mocks.UploadTokenError,
}));
vi.mock("@/features/uploads/services/finalizeUpload", () => ({
  finalizeUpload: mocks.finalizeUpload,
  retryExtraction: mocks.retryExtraction,
}));
vi.mock("@/features/uploads/queries/sourceFileQueries", () => ({
  listOwnedSourceFiles: mocks.listOwnedSourceFiles,
  getOwnedSourceFileDetail: mocks.getOwnedSourceFileDetail,
}));
vi.mock("@/features/uploads/services/janitor", () => ({
  runJanitor: mocks.runJanitor,
}));

import { POST as tokenPost } from "@/app/api/uploads/token/route";
import { POST as finalizePost } from "@/app/api/uploads/finalize/route";
import { POST as extractPost } from "@/app/api/uploads/extract/route";
import { GET as listGet } from "@/app/api/uploads/route";
import { GET as detailGet } from "@/app/api/uploads/[sourceFileId]/route";
import { GET as janitorGet } from "@/app/api/jobs/janitor/route";
import { MAX_UPLOAD_BYTES } from "@/features/uploads/constants";

const PATHNAME = "sources/user_1/123e4567-e89b-12d3-a456-426614174000";
const USER_ID = "user_1";

const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
const originalCronSecret = process.env.CRON_SECRET;

vi.spyOn(console, "error").mockImplementation(() => undefined);

function post(url: string, body: unknown): Request {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function request(url: string, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost${url}`, { headers });
}

function signIn() {
  mocks.auth.mockResolvedValue({ user: { id: USER_ID } });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.BLOB_READ_WRITE_TOKEN = "blob_token";
  process.env.CRON_SECRET = "cron_secret";
  signIn();
});

afterAll(() => {
  if (originalBlobToken === undefined) {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  } else {
    process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
  }

  if (originalCronSecret === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = originalCronSecret;
  }
});

describe("POST /api/uploads/token", () => {
  it("returns 401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await tokenPost(
      post("/api/uploads/token", { type: "blob.generate-client-token" })
    );

    expect(response.status).toBe(401);
  });

  it("returns 503 when the Blob token is not configured", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const response = await tokenPost(
      post("/api/uploads/token", { type: "blob.generate-client-token" })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: expect.stringContaining("BLOB_READ_WRITE_TOKEN"),
    });
  });

  it("returns 400 for a body that is not JSON", async () => {
    const response = await tokenPost(
      post("/api/uploads/token", "not json")
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when upload details are rejected", async () => {
    mocks.handleUpload.mockImplementation(
      async ({
        onBeforeGenerateToken,
      }: {
        onBeforeGenerateToken: (
          pathname: string,
          payload: string | null
        ) => Promise<unknown>;
      }) => onBeforeGenerateToken(PATHNAME, "{}")
    );
    mocks.ensureSourceFileForUpload.mockRejectedValueOnce(
      new mocks.UploadTokenError("That upload destination isn't valid.")
    );

    const response = await tokenPost(
      post("/api/uploads/token", {
        type: "blob.generate-client-token",
        payload: { pathname: PATHNAME, clientPayload: "{}" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "That upload destination isn't valid.",
    });
  });

  it("returns 500 when token generation throws unexpectedly", async () => {
    mocks.handleUpload.mockRejectedValueOnce(new Error("boom"));

    const response = await tokenPost(
      post("/api/uploads/token", { type: "blob.generate-client-token" })
    );

    expect(response.status).toBe(500);
  });

  it("mints a client token with the configured limits", async () => {
    mocks.ensureSourceFileForUpload.mockResolvedValue({
      sourceFileId: "sf_1",
    });
    mocks.handleUpload.mockImplementation(
      async ({
        onBeforeGenerateToken,
      }: {
        onBeforeGenerateToken: (
          pathname: string,
          payload: string | null
        ) => Promise<Record<string, unknown>>;
      }) => {
        const config = await onBeforeGenerateToken(
          PATHNAME,
          JSON.stringify({
            name: "notes.pdf",
            type: "application/pdf",
            size: 4_096,
          })
        );

        expect(config).toMatchObject({
          allowedContentTypes: expect.arrayContaining(["application/pdf"]),
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        });

        return {
          type: "blob.generate-client-token",
          clientToken: "client-token",
        };
      }
    );

    const response = await tokenPost(
      post("/api/uploads/token", { type: "blob.generate-client-token" })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      type: "blob.generate-client-token",
      clientToken: "client-token",
    });
    expect(mocks.ensureSourceFileForUpload).toHaveBeenCalledWith({
      userId: USER_ID,
      pathname: PATHNAME,
      clientPayload: expect.any(String),
    });
  });
});

describe("POST /api/uploads/finalize", () => {
  it("returns 401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await finalizePost(
      post("/api/uploads/finalize", { pathname: PATHNAME })
    );

    expect(response.status).toBe(401);
  });

  it("returns 503 without a Blob token", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const response = await finalizePost(
      post("/api/uploads/finalize", { pathname: PATHNAME })
    );

    expect(response.status).toBe(503);
  });

  it("returns 400 for an invalid pathname", async () => {
    const response = await finalizePost(
      post("/api/uploads/finalize", { pathname: "" })
    );

    expect(response.status).toBe(400);
    expect(mocks.finalizeUpload).not.toHaveBeenCalled();
  });

  it("returns 404 when the upload is not owned", async () => {
    mocks.finalizeUpload.mockResolvedValue({ kind: "not_found" });

    const response = await finalizePost(
      post("/api/uploads/finalize", { pathname: PATHNAME })
    );

    expect(response.status).toBe(404);
  });

  it("returns the extraction result", async () => {
    const result = {
      sourceFile: { id: "sf_1", status: "READY" },
      inProgress: false,
    };
    mocks.finalizeUpload.mockResolvedValue({ kind: "ok", result });

    const response = await finalizePost(
      post("/api/uploads/finalize", { pathname: PATHNAME })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(mocks.finalizeUpload).toHaveBeenCalledWith({
      ownerId: USER_ID,
      pathname: PATHNAME,
    });
  });

  it("returns 500 when finalize throws", async () => {
    mocks.finalizeUpload.mockRejectedValueOnce(new Error("boom"));

    const response = await finalizePost(
      post("/api/uploads/finalize", { pathname: PATHNAME })
    );

    expect(response.status).toBe(500);
  });
});

describe("POST /api/uploads/extract", () => {
  it("returns 401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await extractPost(
      post("/api/uploads/extract", { sourceFileId: "sf_1" })
    );

    expect(response.status).toBe(401);
  });

  it("returns 503 without a Blob token", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const response = await extractPost(
      post("/api/uploads/extract", { sourceFileId: "sf_1" })
    );

    expect(response.status).toBe(503);
  });

  it("returns 400 for an invalid body", async () => {
    const response = await extractPost(
      post("/api/uploads/extract", { sourceFileId: "" })
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the source is not owned", async () => {
    mocks.retryExtraction.mockResolvedValue({ kind: "not_found" });

    const response = await extractPost(
      post("/api/uploads/extract", { sourceFileId: "sf_1" })
    );

    expect(response.status).toBe(404);
  });

  it("returns the retry result", async () => {
    const result = {
      sourceFile: { id: "sf_1", status: "EXTRACTING" },
      inProgress: true,
    };
    mocks.retryExtraction.mockResolvedValue({ kind: "ok", result });

    const response = await extractPost(
      post("/api/uploads/extract", { sourceFileId: "sf_1" })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(mocks.retryExtraction).toHaveBeenCalledWith({
      ownerId: USER_ID,
      sourceFileId: "sf_1",
    });
  });

  it("returns 500 when the retry throws", async () => {
    mocks.retryExtraction.mockRejectedValueOnce(new Error("boom"));

    const response = await extractPost(
      post("/api/uploads/extract", { sourceFileId: "sf_1" })
    );

    expect(response.status).toBe(500);
  });
});

describe("GET /api/uploads", () => {
  it("returns 401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await listGet(request("/api/uploads"));

    expect(response.status).toBe(401);
  });

  it("returns the owner's uploads", async () => {
    mocks.listOwnedSourceFiles.mockResolvedValue([
      { id: "sf_1", status: "READY" },
    ]);

    const response = await listGet(request("/api/uploads"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sources: [{ id: "sf_1", status: "READY" }],
    });
    expect(mocks.listOwnedSourceFiles).toHaveBeenCalledWith(USER_ID, 12);
  });

  it.each([
    ["999", 50],
    ["0", 1],
    ["not-a-number", 12],
  ])("clamps limit=%s to %i", async (limit, expected) => {
    mocks.listOwnedSourceFiles.mockResolvedValue([]);

    await listGet(request(`/api/uploads?limit=${limit}`));

    expect(mocks.listOwnedSourceFiles).toHaveBeenCalledWith(
      USER_ID,
      expected
    );
  });

  it("returns 500 when the query throws", async () => {
    mocks.listOwnedSourceFiles.mockRejectedValueOnce(new Error("boom"));

    const response = await listGet(request("/api/uploads"));

    expect(response.status).toBe(500);
  });
});

describe("GET /api/uploads/[sourceFileId]", () => {
  const params = { params: { sourceFileId: "sf_1" } };

  it("returns 401 when signed out", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await detailGet(request("/api/uploads/sf_1"), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for a missing or unowned source", async () => {
    mocks.getOwnedSourceFileDetail.mockResolvedValue(null);

    const response = await detailGet(request("/api/uploads/sf_1"), params);

    expect(response.status).toBe(404);
  });

  it("returns the source detail", async () => {
    mocks.getOwnedSourceFileDetail.mockResolvedValue({
      id: "sf_1",
      status: "READY",
    });

    const response = await detailGet(request("/api/uploads/sf_1"), params);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      source: { id: "sf_1", status: "READY" },
    });
    expect(mocks.getOwnedSourceFileDetail).toHaveBeenCalledWith(
      "sf_1",
      USER_ID
    );
  });

  it("returns 500 when the query throws", async () => {
    mocks.getOwnedSourceFileDetail.mockRejectedValueOnce(new Error("boom"));

    const response = await detailGet(request("/api/uploads/sf_1"), params);

    expect(response.status).toBe(500);
  });
});

describe("GET /api/jobs/janitor", () => {
  it("returns 503 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await janitorGet(request("/api/jobs/janitor"));

    expect(response.status).toBe(503);
    expect(mocks.runJanitor).not.toHaveBeenCalled();
  });

  it("returns 401 without the cron secret", async () => {
    const response = await janitorGet(request("/api/jobs/janitor"));

    expect(response.status).toBe(401);
  });

  it("returns 401 for the wrong secret", async () => {
    const response = await janitorGet(
      request("/api/jobs/janitor", { authorization: "Bearer wrong" })
    );

    expect(response.status).toBe(401);
  });

  it("accepts the Vercel Cron bearer header", async () => {
    const result = {
      staleSourcesFailed: 0,
      orphanBlobsDeleted: 0,
      blobDeletesRetried: 0,
      unattachedSourcesDeleted: 0,
      errors: [],
    };
    mocks.runJanitor.mockResolvedValue(result);

    const response = await janitorGet(
      request("/api/jobs/janitor", {
        authorization: "Bearer cron_secret",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, result });
  });

  it("also accepts the raw secret for manual runs", async () => {
    mocks.runJanitor.mockResolvedValue({
      staleSourcesFailed: 0,
      orphanBlobsDeleted: 0,
      blobDeletesRetried: 0,
      unattachedSourcesDeleted: 0,
      errors: [],
    });

    const response = await janitorGet(
      request("/api/jobs/janitor", { authorization: "cron_secret" })
    );

    expect(response.status).toBe(200);
  });

  it("returns 500 when the janitor throws", async () => {
    mocks.runJanitor.mockRejectedValueOnce(new Error("boom"));

    const response = await janitorGet(
      request("/api/jobs/janitor", {
        authorization: "Bearer cron_secret",
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false });
  });
});
