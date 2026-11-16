import { describe, expect, it } from "vitest";

import {
  gradeEnumeration,
  gradeIdentification,
  gradeMultipleChoice,
  gradeQuestion,
  gradeTrueFalse,
} from "@/features/grading/graders";
import type {
  EnumerationQuestion,
  IdentificationQuestion,
} from "@/features/questions/schemas/question.schema";
import {
  enumerationQuestion,
  identificationQuestion,
  multipleChoiceQuestion,
  trueFalseQuestion,
} from "./fixtures/questions";

function enumerationWith(
  payload: Partial<EnumerationQuestion["payload"]>
): EnumerationQuestion {
  return {
    ...enumerationQuestion,
    payload: { ...enumerationQuestion.payload, ...payload },
  };
}

function identificationWith(
  payload: Partial<IdentificationQuestion["payload"]>
): IdentificationQuestion {
  return {
    ...identificationQuestion,
    payload: { ...identificationQuestion.payload, ...payload },
  };
}

function expectZero(result: {
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
}) {
  expect(result.isCorrect).toBe(false);
  expect(result.pointsEarned).toBe(0);
}

describe("gradeMultipleChoice", () => {
  it("awards full points for the correct index", () => {
    const result = gradeMultipleChoice(multipleChoiceQuestion, 1);

    expect(result).toMatchObject({
      questionId: "q1",
      type: "MULTIPLE_CHOICE",
      isCorrect: true,
      pointsEarned: 1,
      pointsPossible: 1,
    });
  });

  it("scores zero for a different index", () => {
    expectZero(gradeMultipleChoice(multipleChoiceQuestion, 0));
  });

  it("scores zero for an index outside the option list", () => {
    expectZero(gradeMultipleChoice(multipleChoiceQuestion, 3));
  });

  it("scores zero for a string, object, or fractional index", () => {
    expectZero(gradeMultipleChoice(multipleChoiceQuestion, "1"));
    expectZero(gradeMultipleChoice(multipleChoiceQuestion, { optionIndex: 1 }));
    expectZero(gradeMultipleChoice(multipleChoiceQuestion, 1.5));
    expectZero(gradeMultipleChoice(multipleChoiceQuestion, -1));
  });

  it("scores zero for a missing or null submission", () => {
    expectZero(gradeMultipleChoice(multipleChoiceQuestion, undefined));
    expectZero(gradeMultipleChoice(multipleChoiceQuestion, null));
  });

  it("respects the question's point value", () => {
    const result = gradeMultipleChoice(
      { ...multipleChoiceQuestion, points: 2.5 },
      1
    );

    expect(result.pointsEarned).toBe(2.5);
    expect(result.pointsPossible).toBe(2.5);
  });

  it("treats invalid point values as zero possible points", () => {
    const zeroPoints = gradeMultipleChoice(
      { ...multipleChoiceQuestion, points: 0 },
      1
    );
    expect(zeroPoints.pointsPossible).toBe(0);
    expect(zeroPoints.pointsEarned).toBe(0);

    const notANumber = gradeTrueFalse(
      { ...trueFalseQuestion, points: Number.NaN },
      true
    );
    expect(notANumber.pointsPossible).toBe(0);
    expect(notANumber.pointsEarned).toBe(0);
  });
});

describe("gradeTrueFalse", () => {
  const question = trueFalseQuestion;

  it("awards full points for the correct boolean", () => {
    expect(gradeTrueFalse(question, true)).toMatchObject({
      isCorrect: true,
      pointsEarned: 1,
    });
  });

  it("awards full points for a correct false answer", () => {
    const result = gradeTrueFalse(
      {
        ...question,
        payload: { ...question.payload, answer: false },
      },
      false
    );

    expect(result.isCorrect).toBe(true);
  });

  it("scores zero for the opposite boolean", () => {
    expectZero(gradeTrueFalse(question, false));
  });

  it("scores zero for truthy strings and numbers", () => {
    expectZero(gradeTrueFalse(question, "true"));
    expectZero(gradeTrueFalse(question, 1));
  });

  it("scores zero for missing or null submissions", () => {
    expectZero(gradeTrueFalse(question, undefined));
    expectZero(gradeTrueFalse(question, null));
  });
});

describe("gradeIdentification", () => {
  it("matches an exact accepted answer", () => {
    expect(gradeIdentification(identificationQuestion, "mitochondrion")).toMatchObject({
      isCorrect: true,
      pointsEarned: 1,
    });
  });

  it("matches aliases", () => {
    expect(gradeIdentification(identificationQuestion, "Mitochondria").isCorrect).toBe(
      true
    );
  });

  it("ignores extra whitespace", () => {
    expect(
      gradeIdentification(identificationQuestion, "   mitochondrion   ").isCorrect
    ).toBe(true);
  });

  it("ignores casing by default", () => {
    expect(gradeIdentification(identificationQuestion, "MITOCHONDRION").isCorrect).toBe(
      true
    );
  });

  it("ignores punctuation", () => {
    expect(gradeIdentification(identificationQuestion, "mitochondrion.").isCorrect).toBe(
      true
    );
  });

  it("ignores leading articles", () => {
    expect(
      gradeIdentification(identificationQuestion, "The Mitochondrion!").isCorrect
    ).toBe(true);
  });

  it("scores zero for a blank submission", () => {
    expectZero(gradeIdentification(identificationQuestion, ""));
    expectZero(gradeIdentification(identificationQuestion, "   "));
    expectZero(gradeIdentification(identificationQuestion, "!!!"));
  });

  it("scores zero for a wrong answer", () => {
    expectZero(gradeIdentification(identificationQuestion, "ribosome"));
  });

  it("scores zero for wrong submission shapes", () => {
    expectZero(gradeIdentification(identificationQuestion, 42));
    expectZero(gradeIdentification(identificationQuestion, ["mitochondrion"]));
    expectZero(gradeIdentification(identificationQuestion, { text: "mitochondrion" }));
    expectZero(gradeIdentification(identificationQuestion, null));
    expectZero(gradeIdentification(identificationQuestion, undefined));
  });

  it("is case-sensitive when configured", () => {
    const question = identificationWith({
      acceptedAnswers: ["ATP"],
      caseSensitive: true,
    });

    expect(gradeIdentification(question, "ATP").isCorrect).toBe(true);
    expectZero(gradeIdentification(question, "atp"));
    expectZero(gradeIdentification(question, "Atp"));
  });

  it("still trims and normalizes credentials when case-sensitive", () => {
    const question = identificationWith({
      acceptedAnswers: ["ATP synthase"],
      caseSensitive: true,
    });

    expect(gradeIdentification(question, "  ATP   synthase. ").isCorrect).toBe(true);
    expect(gradeIdentification(question, "the ATP synthase").isCorrect).toBe(true);
  });

  it("scores zero when there are no accepted answers", () => {
    expectZero(
      gradeIdentification(identificationWith({ acceptedAnswers: [] }), "mitochondrion")
    );
  });
});

describe("gradeEnumeration", () => {
  it("awards full points when every required item is present", () => {
    const result = gradeEnumeration(enumerationQuestion, [
      "mitochondrion",
      "ribosome",
      "nucleus",
    ]);

    expect(result).toMatchObject({
      isCorrect: true,
      pointsEarned: 1,
      matchedItems: 3,
      requiredItems: 3,
    });
  });

  it("awards partial credit for some correct items", () => {
    const result = gradeEnumeration(enumerationQuestion, [
      "mitochondrion",
      "ribosome",
    ]);

    expect(result.isCorrect).toBe(false);
    expect(result.pointsEarned).toBeCloseTo(2 / 3);
    expect(result.matchedItems).toBe(2);
  });

  it("ignores order when orderMatters is false", () => {
    const result = gradeEnumeration(enumerationQuestion, [
      "nucleus",
      "mitochondrion",
      "ribosome",
    ]);

    expect(result.isCorrect).toBe(true);
  });

  it("counts order when orderMatters is true", () => {
    const question = enumerationWith({ orderMatters: true });

    const swapped = gradeEnumeration(question, [
      "ribosome",
      "mitochondrion",
      "nucleus",
    ]);
    expect(swapped.matchedItems).toBe(1);
    expect(swapped.isCorrect).toBe(false);

    const correct = gradeEnumeration(question, [
      "mitochondrion",
      "ribosome",
      "nucleus",
    ]);
    expect(correct.isCorrect).toBe(true);
  });

  it("ignores duplicates instead of inflating the score", () => {
    const question = enumerationWith({ requiredCount: 2 });

    const duplicated = gradeEnumeration(question, ["mitochondrion", "mitochondrion"]);
    expect(duplicated.matchedItems).toBe(1);
    expect(duplicated.pointsEarned).toBeCloseTo(0.5);

    const withDuplicateOfBoth = gradeEnumeration(question, [
      "mitochondrion",
      "mitochondrion",
      "ribosome",
      "ribosome",
    ]);
    expect(withDuplicateOfBoth.isCorrect).toBe(true);
  });

  it("ignores extra items beyond the required count", () => {
    const question = enumerationWith({ requiredCount: 2 });

    const extraCorrect = gradeEnumeration(question, [
      "mitochondrion",
      "ribosome",
      "nucleus",
      "golgi",
    ]);
    expect(extraCorrect.isCorrect).toBe(true);
    expect(extraCorrect.matchedItems).toBe(2);
    expect(extraCorrect.pointsEarned).toBe(1);

    const extraWrong = gradeEnumeration(question, [
      "mitochondrion",
      "golgi",
      "vacuole",
    ]);
    expect(extraWrong.matchedItems).toBe(1);
  });

  it("normalizes whitespace, casing, punctuation, and articles", () => {
    const result = gradeEnumeration(enumerationQuestion, [
      "  The Mitochondrion. ",
      "RIBOSOME",
      "the nucleus!",
    ]);

    expect(result.isCorrect).toBe(true);
  });

  it("filters blank submitted items", () => {
    const question = enumerationWith({
      expectedItems: ["mitochondrion", "ribosome"],
      requiredCount: 2,
    });

    const result = gradeEnumeration(question, [
      "",
      "   ",
      "mitochondrion",
      "ribosome",
    ]);

    expect(result.isCorrect).toBe(true);
    expect(result.matchedItems).toBe(2);
  });

  it("scores zero for a blank submission", () => {
    expectZero(gradeEnumeration(enumerationQuestion, []));
    expectZero(gradeEnumeration(enumerationQuestion, ["", "   "]));
  });

  it("scores zero for wrong submission shapes", () => {
    expectZero(gradeEnumeration(enumerationQuestion, "mitochondrion"));
    expectZero(gradeEnumeration(enumerationQuestion, [1, 2, 3]));
    expectZero(gradeEnumeration(enumerationQuestion, { items: ["mitochondrion"] }));
    expectZero(gradeEnumeration(enumerationQuestion, null));
    expectZero(gradeEnumeration(enumerationQuestion, undefined));
  });

  it("scores zero when the question has no expected items", () => {
    const question = enumerationWith({ expectedItems: [], requiredCount: 1 });
    expectZero(gradeEnumeration(question, ["mitochondrion"]));
  });

  it("scores zero when the required count is not positive", () => {
    const question = enumerationWith({ requiredCount: 0 });
    expectZero(gradeEnumeration(question, ["mitochondrion"]));
  });

  it("awards partial credit proportional to the question's points", () => {
    const question: EnumerationQuestion = {
      ...enumerationWith({
        expectedItems: ["a", "b", "c", "d"],
        requiredCount: 4,
      }),
      points: 2,
    };

    const result = gradeEnumeration(question, ["a", "b"]);
    expect(result.pointsEarned).toBe(1);
    expect(result.pointsPossible).toBe(2);
  });

  it("awards partial credit for a short ordered submission", () => {
    const question = enumerationWith({ orderMatters: true });

    const result = gradeEnumeration(question, ["mitochondrion", "ribosome"]);
    expect(result.matchedItems).toBe(2);
    expect(result.isCorrect).toBe(false);
    expect(result.pointsEarned).toBeCloseTo(2 / 3);
  });
});

describe("gradeQuestion dispatch", () => {
  it("routes each type to its grader", () => {
    expect(gradeQuestion(multipleChoiceQuestion, 1).isCorrect).toBe(true);
    expect(gradeQuestion(trueFalseQuestion, true).isCorrect).toBe(true);
    expect(gradeQuestion(identificationQuestion, "mitochondrion").isCorrect).toBe(
      true
    );
    expect(
      gradeQuestion(enumerationQuestion, ["mitochondrion", "ribosome", "nucleus"])
        .isCorrect
    ).toBe(true);
  });

  it("scores zero for an unknown runtime type", () => {
    const result = gradeQuestion(
      { ...trueFalseQuestion, type: "UNKNOWN" } as never,
      true
    );

    expect(result.isCorrect).toBe(false);
    expect(result.pointsEarned).toBe(0);
  });
});
