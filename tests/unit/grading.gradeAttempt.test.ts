import { describe, expect, it } from "vitest";

import { gradeAttempt } from "@/features/grading/services/gradeAttempt";
import type { Question } from "@/features/questions/schemas/question.schema";
import {
  enumerationQuestion,
  identificationQuestion,
  multipleChoiceQuestion,
  trueFalseQuestion,
} from "./fixtures/questions";

const questions: Question[] = [
  multipleChoiceQuestion,
  trueFalseQuestion,
  identificationQuestion,
  enumerationQuestion,
];

describe("gradeAttempt", () => {
  it("returns a result per question, totals, and a percentage", () => {
    const result = gradeAttempt(questions, {
      q1: 1,
      q2: false,
      q3: "Mitochondria",
      q4: ["mitochondrion", "ribosome", "nucleus"],
    });

    expect(result.results).toHaveLength(4);
    expect(result.results.map((item) => item.questionId)).toEqual([
      "q1",
      "q2",
      "q3",
      "q4",
    ]);

    expect(result.results[0]?.isCorrect).toBe(true);
    expect(result.results[1]?.isCorrect).toBe(false);
    expect(result.results[2]?.isCorrect).toBe(true);
    expect(result.results[3]?.isCorrect).toBe(true);

    expect(result.correctCount).toBe(3);
    expect(result.questionCount).toBe(4);
    expect(result.pointsEarned).toBe(3);
    expect(result.pointsPossible).toBe(4);
    expect(result.percentage).toBe(75);
  });

  it("scores missing submissions as zero", () => {
    const result = gradeAttempt(questions, {});

    expect(result.results.every((item) => !item.isCorrect)).toBe(true);
    expect(result.pointsEarned).toBe(0);
    expect(result.pointsPossible).toBe(4);
    expect(result.percentage).toBe(0);
    expect(result.correctCount).toBe(0);
  });

  it("defaults submissions to an empty map", () => {
    const result = gradeAttempt(questions);

    expect(result.pointsEarned).toBe(0);
    expect(result.pointsPossible).toBe(4);
  });

  it("ignores submissions for unknown question ids", () => {
    const result = gradeAttempt(questions, {
      q1: 1,
      extra: "ignored",
      another: ["nope"],
    });

    expect(result.correctCount).toBe(1);
    expect(result.results).toHaveLength(4);
  });

  it("keeps partial enumeration credit in the total", () => {
    const result = gradeAttempt(questions, {
      q4: ["mitochondrion", "ribosome"],
    });

    expect(result.results[3]?.isCorrect).toBe(false);
    expect(result.results[3]?.matchedItems).toBe(2);
    expect(result.pointsEarned).toBeCloseTo(2 / 3);
    expect(result.percentage).toBeCloseTo(16.67);
  });

  it("rounds the percentage to two decimals", () => {
    const result = gradeAttempt(
      [
        { ...multipleChoiceQuestion, points: 1 },
        { ...multipleChoiceQuestion, id: "q9", points: 2 },
      ],
      { q1: 1, q9: 1 }
    );

    expect(result.percentage).toBe(100);

    const third = gradeAttempt(
      [
        { ...multipleChoiceQuestion, points: 1 },
        { ...multipleChoiceQuestion, id: "q9", points: 2 },
      ],
      { q1: 1, q9: 0 }
    );

    expect(third.percentage).toBe(33.33);
  });

  it("does not throw when a question is malformed", () => {
    const broken = {
      ...trueFalseQuestion,
      id: "broken",
      payload: Object.defineProperty({}, "answer", {
        get() {
          throw new Error("corrupt payload");
        },
      }),
    } as unknown as Question;

    const result = gradeAttempt([...questions, broken], {
      q1: 1,
      broken: true,
    });

    expect(result.results).toHaveLength(5);
    const brokenResult = result.results[4];
    expect(brokenResult).toMatchObject({
      questionId: "broken",
      isCorrect: false,
      pointsEarned: 0,
      pointsPossible: 0,
    });
    expect(result.pointsEarned).toBe(1);
    expect(result.pointsPossible).toBe(4);
  });

  it("returns zero percentage when there is nothing gradable", () => {
    const broken = {
      ...multipleChoiceQuestion,
      payload: null,
    } as unknown as Question;

    const result = gradeAttempt([broken], { q1: 0 });

    expect(result.pointsPossible).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.questionCount).toBe(1);
  });

  it("does not mutate the questions or submissions", () => {
    const submissions = { q1: 1 };
    const questionSnapshot = JSON.parse(JSON.stringify(questions));

    gradeAttempt(questions, submissions);

    expect(questions).toEqual(questionSnapshot);
    expect(submissions).toEqual({ q1: 1 });
  });
});
