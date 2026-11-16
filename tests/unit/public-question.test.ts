import { describe, expect, it } from "vitest";

import { toPublicQuestion } from "@/features/questions/mappers/toPublicQuestion";
import {
  enumerationQuestion,
  identificationQuestion,
  multipleChoiceQuestion,
  trueFalseQuestion,
} from "./fixtures/questions";

const FORBIDDEN_KEYS = [
  "correctOptionIndex",
  "answer",
  "acceptedAnswers",
  "expectedItems",
  "explanation",
  "caseSensitive",
  "isCorrect",
];

function collectKeys(value: unknown, keys: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return keys;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      collectKeys(child, keys);
    }
  }

  return keys;
}

function expectNoAnswerFields(question: ReturnType<typeof toPublicQuestion>) {
  const serialized = JSON.stringify(question);

  for (const key of FORBIDDEN_KEYS) {
    expect(serialized).not.toContain(`"${key}"`);
  }

  const keys = collectKeys(question);
  expect(keys.filter((key) => FORBIDDEN_KEYS.includes(key))).toEqual([]);
}

describe("toPublicQuestion", () => {
  it("maps multiple choice without the correct index or explanation", () => {
    const publicQuestion = toPublicQuestion(multipleChoiceQuestion);

    expect(publicQuestion).toEqual({
      id: "q1",
      quizId: "quiz1",
      position: 0,
      points: 1,
      sourceExcerpt: null,
      type: "MULTIPLE_CHOICE",
      payload: {
        prompt: "Which organelle produces ATP?",
        options: ["Nucleus", "Mitochondrion", "Ribosome"],
      },
    });
    expectNoAnswerFields(publicQuestion);
  });

  it("maps true/false without the answer or explanation", () => {
    const publicQuestion = toPublicQuestion(trueFalseQuestion);

    expect(publicQuestion).toEqual({
      id: "q2",
      quizId: "quiz1",
      position: 1,
      points: 1,
      sourceExcerpt: null,
      type: "TRUE_FALSE",
      payload: {
        statement: "Mitochondria are found in eukaryotic cells.",
      },
    });
    expectNoAnswerFields(publicQuestion);
  });

  it("maps identification without accepted answers or explanation", () => {
    const publicQuestion = toPublicQuestion(identificationQuestion);

    expect(publicQuestion).toEqual({
      id: "q3",
      quizId: "quiz1",
      position: 2,
      points: 1,
      sourceExcerpt: null,
      type: "IDENTIFICATION",
      payload: {
        prompt: "Name the organelle responsible for aerobic respiration.",
      },
    });
    expectNoAnswerFields(publicQuestion);
  });

  it("maps enumeration without expected items or explanation", () => {
    const publicQuestion = toPublicQuestion(enumerationQuestion);

    expect(publicQuestion).toEqual({
      id: "q4",
      quizId: "quiz1",
      position: 3,
      points: 1,
      sourceExcerpt: null,
      type: "ENUMERATION",
      payload: {
        prompt: "Name three organelles found in a eukaryotic cell.",
        requiredCount: 3,
        orderMatters: false,
      },
    });
    expectNoAnswerFields(publicQuestion);
  });

  it("does not mutate the source question", () => {
    const snapshot = JSON.parse(JSON.stringify(multipleChoiceQuestion));

    toPublicQuestion(multipleChoiceQuestion);

    expect(multipleChoiceQuestion).toEqual(snapshot);
  });

  it("copies the option array so callers cannot mutate the source", () => {
    const publicQuestion = toPublicQuestion(multipleChoiceQuestion);

    if (publicQuestion.type === "MULTIPLE_CHOICE") {
      publicQuestion.payload.options.push("Injected");
    }

    expect(multipleChoiceQuestion.payload.options).toEqual([
      "Nucleus",
      "Mitochondrion",
      "Ribosome",
    ]);
  });

  it("strips secrets even when the source has no explanation", () => {
    const publicQuestion = toPublicQuestion({
      ...trueFalseQuestion,
      payload: { statement: "Water boils at 100C.", answer: true },
    });

    expectNoAnswerFields(publicQuestion);
  });
});
