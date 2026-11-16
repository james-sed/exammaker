import type {
  EnumerationQuestion,
  IdentificationQuestion,
  MultipleChoiceQuestion,
  Question,
  QuestionType,
  TrueFalseQuestion,
} from "@/features/questions/schemas/question.schema";
import { normalizeText } from "./normalize";
import {
  enumerationSubmissionSchema,
  identificationSubmissionSchema,
  multipleChoiceSubmissionSchema,
  trueFalseSubmissionSchema,
} from "./schemas/submission.schema";
import type { QuestionGradeResult } from "./types/grading.types";

/**
 * The single grading module. Every grader is a pure function: it validates
 * its submission, never mutates its inputs, never touches the database or
 * network, and returns a zero result instead of throwing.
 */

function pointsPossibleFor(question: { points: number }): number {
  return Number.isFinite(question.points) && question.points > 0
    ? question.points
    : 0;
}

function zeroResult(
  question: { id: string; type: QuestionType; points: number },
  extra: Partial<QuestionGradeResult> = {}
): QuestionGradeResult {
  return {
    questionId: question.id,
    type: question.type,
    isCorrect: false,
    pointsEarned: 0,
    pointsPossible: pointsPossibleFor(question),
    ...extra,
  };
}

function score(
  question: { id: string; type: QuestionType; points: number },
  isCorrect: boolean,
  extra: Partial<QuestionGradeResult> = {}
): QuestionGradeResult {
  const pointsPossible = pointsPossibleFor(question);

  return {
    questionId: question.id,
    type: question.type,
    isCorrect,
    pointsEarned: isCorrect ? pointsPossible : 0,
    pointsPossible,
    ...extra,
  };
}

function uniqueNormalized(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (value && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Multiple choice — exact match on the option index.
// ---------------------------------------------------------------------------

export function gradeMultipleChoice(
  question: MultipleChoiceQuestion,
  submission: unknown
): QuestionGradeResult {
  const parsed = multipleChoiceSubmissionSchema.safeParse(submission);

  if (!parsed.success) {
    return zeroResult(question);
  }

  return score(question, parsed.data === question.payload.correctOptionIndex);
}

// ---------------------------------------------------------------------------
// True / false — exact match on the boolean.
// ---------------------------------------------------------------------------

export function gradeTrueFalse(
  question: TrueFalseQuestion,
  submission: unknown
): QuestionGradeResult {
  const parsed = trueFalseSubmissionSchema.safeParse(submission);

  if (!parsed.success) {
    return zeroResult(question);
  }

  return score(question, parsed.data === question.payload.answer);
}

// ---------------------------------------------------------------------------
// Identification — normalized match against the accepted answers.
// ---------------------------------------------------------------------------

export function gradeIdentification(
  question: IdentificationQuestion,
  submission: unknown
): QuestionGradeResult {
  const parsed = identificationSubmissionSchema.safeParse(submission);

  if (!parsed.success) {
    return zeroResult(question);
  }

  const { acceptedAnswers, caseSensitive } = question.payload;
  const normalizedSubmission = normalizeText(parsed.data, { caseSensitive });

  if (!normalizedSubmission) {
    return zeroResult(question);
  }

  const isCorrect = acceptedAnswers.some(
    (accepted) =>
      normalizeText(accepted, { caseSensitive }) === normalizedSubmission
  );

  return score(question, isCorrect);
}

// ---------------------------------------------------------------------------
// Enumeration — normalized set/order match with partial credit.
// ---------------------------------------------------------------------------

export function gradeEnumeration(
  question: EnumerationQuestion,
  submission: unknown
): QuestionGradeResult {
  const parsed = enumerationSubmissionSchema.safeParse(submission);

  if (!parsed.success) {
    return zeroResult(question);
  }

  const { requiredCount, orderMatters } = question.payload;
  const expected = uniqueNormalized(
    question.payload.expectedItems.map((item) => normalizeText(item))
  );
  const submitted = uniqueNormalized(
    parsed.data.map((item) => normalizeText(item)).filter(Boolean)
  );

  if (requiredCount <= 0 || expected.length === 0) {
    return zeroResult(question, {
      matchedItems: 0,
      requiredItems: requiredCount,
    });
  }

  let matched = 0;

  if (orderMatters) {
    const limit = Math.min(requiredCount, submitted.length, expected.length);

    for (let index = 0; index < limit; index += 1) {
      if (submitted[index] === expected[index]) {
        matched += 1;
      }
    }
  } else {
    const expectedSet = new Set(expected);

    for (const item of submitted) {
      if (expectedSet.has(item)) {
        matched += 1;
        if (matched === requiredCount) {
          break;
        }
      }
    }
  }

  matched = Math.min(matched, requiredCount);

  const pointsPossible = pointsPossibleFor(question);
  const isCorrect = matched === requiredCount;

  return {
    questionId: question.id,
    type: question.type,
    isCorrect,
    pointsEarned: isCorrect ? pointsPossible : (pointsPossible * matched) / requiredCount,
    pointsPossible,
    matchedItems: matched,
    requiredItems: requiredCount,
  };
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

const gradersByType: Record<
  QuestionType,
  (question: Question, submission: unknown) => QuestionGradeResult
> = {
  MULTIPLE_CHOICE: (question, submission) =>
    gradeMultipleChoice(question as MultipleChoiceQuestion, submission),
  TRUE_FALSE: (question, submission) =>
    gradeTrueFalse(question as TrueFalseQuestion, submission),
  IDENTIFICATION: (question, submission) =>
    gradeIdentification(question as IdentificationQuestion, submission),
  ENUMERATION: (question, submission) =>
    gradeEnumeration(question as EnumerationQuestion, submission),
};

/**
 * Grades one question. Unknown runtime types and malformed submissions score
 * zero; this function never throws.
 */
export function gradeQuestion(
  question: Question,
  submission: unknown
): QuestionGradeResult {
  const grader = (
    gradersByType as Partial<
      Record<string, (question: Question, submission: unknown) => QuestionGradeResult>
    >
  )[question.type];

  if (!grader) {
    return zeroResult(question);
  }

  return grader(question, submission);
}
