import type {
  EnumerationQuestion,
  IdentificationQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
} from "../schemas/question.schema";
import type {
  PublicEnumerationQuestion,
  PublicIdentificationQuestion,
  PublicMultipleChoiceQuestion,
  PublicTrueFalseQuestion,
} from "../types/question.types";

/**
 * Strips the answer key and explanation from a multiple choice question.
 * Only the option text and its display order survive.
 */
export function toPublicMultipleChoiceQuestion(
  question: MultipleChoiceQuestion
): PublicMultipleChoiceQuestion {
  return {
    id: question.id,
    quizId: question.quizId,
    position: question.position,
    points: question.points,
    sourceExcerpt: question.sourceExcerpt,
    type: "MULTIPLE_CHOICE",
    payload: {
      prompt: question.payload.prompt,
      options: [...question.payload.options],
    },
  };
}

/** Strips the correct boolean and explanation. */
export function toPublicTrueFalseQuestion(
  question: TrueFalseQuestion
): PublicTrueFalseQuestion {
  return {
    id: question.id,
    quizId: question.quizId,
    position: question.position,
    points: question.points,
    sourceExcerpt: question.sourceExcerpt,
    type: "TRUE_FALSE",
    payload: {
      statement: question.payload.statement,
    },
  };
}

/** Strips accepted answers, case sensitivity, and explanation. */
export function toPublicIdentificationQuestion(
  question: IdentificationQuestion
): PublicIdentificationQuestion {
  return {
    id: question.id,
    quizId: question.quizId,
    position: question.position,
    points: question.points,
    sourceExcerpt: question.sourceExcerpt,
    type: "IDENTIFICATION",
    payload: {
      prompt: question.payload.prompt,
    },
  };
}

/** Strips expected items and explanation; keeps grading instructions. */
export function toPublicEnumerationQuestion(
  question: EnumerationQuestion
): PublicEnumerationQuestion {
  return {
    id: question.id,
    quizId: question.quizId,
    position: question.position,
    points: question.points,
    sourceExcerpt: question.sourceExcerpt,
    type: "ENUMERATION",
    payload: {
      prompt: question.payload.prompt,
      requiredCount: question.payload.requiredCount,
      orderMatters: question.payload.orderMatters,
    },
  };
}
