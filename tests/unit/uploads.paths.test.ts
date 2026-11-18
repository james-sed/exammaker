import { describe, expect, it } from "vitest";
import {
  buildUploadPathname,
  parseUploadPathname,
  uploadPathPrefix,
} from "@/features/uploads/services/uploadPaths";

const UPLOAD_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("upload paths", () => {
  it("builds a pathname under the user's own prefix", () => {
    expect(uploadPathPrefix("user_1")).toBe("sources/user_1/");
    expect(buildUploadPathname("user_1", UPLOAD_ID)).toBe(
      `sources/user_1/${UPLOAD_ID}`
    );
  });

  it("round-trips a valid pathname", () => {
    expect(parseUploadPathname(buildUploadPathname("user_1", UPLOAD_ID))).toEqual(
      { userId: "user_1", uploadId: UPLOAD_ID }
    );
  });

  it("accepts compact alphanumeric ids", () => {
    expect(
      parseUploadPathname("sources/user_1/abcdefghijklmnopqrstuvwx")
    ).toEqual({ userId: "user_1", uploadId: "abcdefghijklmnopqrstuvwx" });
  });

  it.each([
    "uploads/user_1/abcdefgh",
    "sources/user_1",
    "sources/user_1/",
    "sources//abcdefgh",
    "sources/user_1/abc",
    "sources/user_1/abcdefgh/extra",
    "sources/user_1/abc_defgh",
    "sources/user_1/../abcdefgh",
    "sources/user_1/abcdefgh?x=1",
    "/sources/user_1/abcdefgh",
  ])("rejects a malformed pathname: %s", (pathname) => {
    expect(parseUploadPathname(pathname)).toBeNull();
  });
});
