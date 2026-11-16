import { describe, expect, it } from "vitest";

import {
  defaultQuizSettings,
  parseQuizSettings,
  quizSettingsSchema,
} from "@/features/quizzes/schemas/quiz.schema";

describe("parseQuizSettings", () => {
  it("reads a complete settings object", () => {
    expect(
      parseQuizSettings({
        timeLimitMinutes: 30,
        attemptLimit: 3,
        shuffleOptions: true,
      })
    ).toEqual({
      timeLimitMinutes: 30,
      attemptLimit: 3,
      shuffleOptions: true,
    });
  });

  it("falls back to defaults for an empty object", () => {
    expect(parseQuizSettings({})).toEqual(defaultQuizSettings);
  });

  it("falls back to defaults for null or malformed data", () => {
    expect(parseQuizSettings(null)).toEqual(defaultQuizSettings);
    expect(parseQuizSettings("nope")).toEqual(defaultQuizSettings);
    expect(parseQuizSettings({ attemptLimit: 0 })).toEqual(defaultQuizSettings);
  });
});

describe("quizSettingsSchema", () => {
  const valid = { title: "Biology midterm" };

  it("accepts a title with defaults applied", () => {
    const parsed = quizSettingsSchema.parse(valid);

    expect(parsed.attemptLimit).toBe(1);
    expect(parsed.shuffleOptions).toBe(false);
  });

  it("requires a title of at least 3 characters", () => {
    expect(quizSettingsSchema.safeParse({ title: "ab" }).success).toBe(false);
  });

  it("rejects an attempt limit below 1", () => {
    expect(
      quizSettingsSchema.safeParse({ ...valid, attemptLimit: 0 }).success
    ).toBe(false);
  });

  it("rejects a time limit above 24 hours", () => {
    expect(
      quizSettingsSchema.safeParse({ ...valid, timeLimitMinutes: 1441 }).success
    ).toBe(false);
  });

  it("allows an untimed quiz", () => {
    const parsed = quizSettingsSchema.parse({
      ...valid,
      timeLimitMinutes: null,
    });

    expect(parsed.timeLimitMinutes).toBeNull();
  });
});
