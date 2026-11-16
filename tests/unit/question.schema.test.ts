import { describe, expect, it } from "vitest";

import {
  enumerationQuestionSchema,
  identificationQuestionSchema,
  multipleChoiceQuestionSchema,
  parseQuestionPayload,
  questionPayloadSchema,
  questionSchema,
  trueFalseQuestionSchema,
} from "@/features/questions/schemas/question.schema";

const base = {
  id: "q1",
  quizId: "quiz1",
  position: 0,
  points: 1,
  sourceExcerpt: null,
};

describe("shared question fields", () => {
  it("applies shared defaults", () => {
    const parsed = multipleChoiceQuestionSchema.parse({
      id: "q1",
      quizId: "quiz1",
      position: 0,
      type: "MULTIPLE_CHOICE",
      payload: {
        prompt: "Pick one",
        options: ["A", "B"],
        correctOptionIndex: 0,
      },
    });

    expect(parsed.points).toBe(1);
    expect(parsed.sourceExcerpt).toBeNull();
  });

  it("rejects a negative position", () => {
    const result = multipleChoiceQuestionSchema.safeParse({
      ...base,
      position: -1,
      type: "MULTIPLE_CHOICE",
      payload: { prompt: "Pick one", options: ["A", "B"], correctOptionIndex: 0 },
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-positive points", () => {
    const result = multipleChoiceQuestionSchema.safeParse({
      ...base,
      points: 0,
      type: "MULTIPLE_CHOICE",
      payload: { prompt: "Pick one", options: ["A", "B"], correctOptionIndex: 0 },
    });

    expect(result.success).toBe(false);
  });
});

describe("MULTIPLE_CHOICE schema", () => {
  const payload = {
    prompt: "Pick one",
    options: ["A", "B", "C"],
    correctOptionIndex: 1,
  };

  it("accepts 2 to 6 options", () => {
    expect(
      multipleChoiceQuestionSchema.safeParse({
        ...base,
        type: "MULTIPLE_CHOICE",
        payload,
      }).success
    ).toBe(true);
  });

  it("rejects fewer than 2 options", () => {
    expect(
      multipleChoiceQuestionSchema.safeParse({
        ...base,
        type: "MULTIPLE_CHOICE",
        payload: { ...payload, options: ["A"] },
      }).success
    ).toBe(false);
  });

  it("rejects more than 6 options", () => {
    expect(
      multipleChoiceQuestionSchema.safeParse({
        ...base,
        type: "MULTIPLE_CHOICE",
        payload: { ...payload, options: ["A", "B", "C", "D", "E", "F", "G"] },
      }).success
    ).toBe(false);
  });

  it("rejects a correct index outside the option list", () => {
    const result = questionSchema.safeParse({
      ...base,
      type: "MULTIPLE_CHOICE",
      payload: { ...payload, correctOptionIndex: 3 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual([
        "payload",
        "correctOptionIndex",
      ]);
    }
  });

  it("rejects an empty option", () => {
    expect(
      multipleChoiceQuestionSchema.safeParse({
        ...base,
        type: "MULTIPLE_CHOICE",
        payload: { ...payload, options: ["A", "  "] },
      }).success
    ).toBe(false);
  });
});

describe("TRUE_FALSE schema", () => {
  const payload = { statement: "The sky is blue.", answer: true };

  it("accepts a boolean answer and defaults the explanation away", () => {
    const parsed = trueFalseQuestionSchema.parse({
      ...base,
      type: "TRUE_FALSE",
      payload,
    });

    expect(parsed.payload.answer).toBe(true);
    expect(parsed.payload.explanation).toBeUndefined();
  });

  it("requires a boolean answer", () => {
    expect(
      trueFalseQuestionSchema.safeParse({
        ...base,
        type: "TRUE_FALSE",
        payload: { statement: "The sky is blue.", answer: "true" },
      }).success
    ).toBe(false);
  });

  it("rejects a missing answer", () => {
    expect(
      trueFalseQuestionSchema.safeParse({
        ...base,
        type: "TRUE_FALSE",
        payload: { statement: "The sky is blue." },
      }).success
    ).toBe(false);
  });
});

describe("IDENTIFICATION schema", () => {
  const payload = { prompt: "Name the organelle", acceptedAnswers: ["mitochondrion"] };

  it("defaults caseSensitive to false", () => {
    const parsed = identificationQuestionSchema.parse({
      ...base,
      type: "IDENTIFICATION",
      payload,
    });

    expect(parsed.payload.caseSensitive).toBe(false);
  });

  it("requires at least one accepted answer", () => {
    expect(
      identificationQuestionSchema.safeParse({
        ...base,
        type: "IDENTIFICATION",
        payload: { ...payload, acceptedAnswers: [] },
      }).success
    ).toBe(false);
  });

  it("rejects a blank accepted answer", () => {
    expect(
      identificationQuestionSchema.safeParse({
        ...base,
        type: "IDENTIFICATION",
        payload: { ...payload, acceptedAnswers: ["  "] },
      }).success
    ).toBe(false);
  });
});

describe("ENUMERATION schema", () => {
  const payload = {
    prompt: "Name three organelles",
    expectedItems: ["mitochondrion", "ribosome", "nucleus"],
    requiredCount: 3,
  };

  it("defaults orderMatters to false", () => {
    const parsed = enumerationQuestionSchema.parse({
      ...base,
      type: "ENUMERATION",
      payload,
    });

    expect(parsed.payload.orderMatters).toBe(false);
  });

  it("rejects a required count of zero", () => {
    expect(
      enumerationQuestionSchema.safeParse({
        ...base,
        type: "ENUMERATION",
        payload: { ...payload, requiredCount: 0 },
      }).success
    ).toBe(false);
  });

  it("rejects a required count greater than the expected items", () => {
    const result = questionSchema.safeParse({
      ...base,
      type: "ENUMERATION",
      payload: { ...payload, requiredCount: 4 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["payload", "requiredCount"]);
    }
  });

  it("requires at least one expected item", () => {
    expect(
      enumerationQuestionSchema.safeParse({
        ...base,
        type: "ENUMERATION",
        payload: { ...payload, expectedItems: [], requiredCount: 1 },
      }).success
    ).toBe(false);
  });
});

describe("discriminated union", () => {
  it("rejects an unknown type", () => {
    expect(
      questionSchema.safeParse({
        ...base,
        type: "ESSAY",
        payload: { prompt: "Write an essay" },
      }).success
    ).toBe(false);
  });

  it("narrows on type", () => {
    const parsed = questionSchema.parse({
      ...base,
      type: "TRUE_FALSE",
      payload: { statement: "The sky is blue.", answer: false },
    });

    if (parsed.type === "TRUE_FALSE") {
      expect(parsed.payload.answer).toBe(false);
    } else {
      throw new Error("Expected TRUE_FALSE");
    }
  });
});

describe("parseQuestionPayload", () => {
  it("attaches the type to a valid payload", () => {
    expect(
      parseQuestionPayload("TRUE_FALSE", {
        statement: "The sky is blue.",
        answer: true,
      })
    ).toEqual({
      type: "TRUE_FALSE",
      statement: "The sky is blue.",
      answer: true,
    });
  });

  it("returns null for an invalid payload", () => {
    expect(parseQuestionPayload("TRUE_FALSE", { answer: true })).toBeNull();
  });

  it("rejects a payload that belongs to another type", () => {
    expect(
      parseQuestionPayload("MULTIPLE_CHOICE", {
        statement: "The sky is blue.",
        answer: true,
      })
    ).toBeNull();
  });
});

describe("questionPayloadSchema", () => {
  it("accepts each discriminant", () => {
    const payloads = [
      { type: "MULTIPLE_CHOICE", prompt: "Pick", options: ["A", "B"], correctOptionIndex: 0 },
      { type: "TRUE_FALSE", statement: "True?", answer: true },
      { type: "IDENTIFICATION", prompt: "Name it", acceptedAnswers: ["x"] },
      {
        type: "ENUMERATION",
        prompt: "List them",
        expectedItems: ["a", "b"],
        requiredCount: 2,
      },
    ];

    for (const payload of payloads) {
      expect(questionPayloadSchema.safeParse(payload).success).toBe(true);
    }
  });
});
