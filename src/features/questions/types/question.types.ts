/**
 * Public question shapes.
 *
 * These are the ONLY question shapes that may be sent to a quiz taker before
 * submission. Answer keys, expected items, accepted answers, and explanations
 * are intentionally absent. Every source question must pass through
 * `toPublicQuestion` before leaving the server.
 */

export interface PublicQuestionBase {
  id: string;
  quizId: string;
  position: number;
  points: number;
  sourceExcerpt: string | null;
}

export interface PublicMultipleChoiceQuestion extends PublicQuestionBase {
  type: "MULTIPLE_CHOICE";
  payload: {
    prompt: string;
    /** Option text in display order. The correct index is not included. */
    options: string[];
  };
}

export interface PublicTrueFalseQuestion extends PublicQuestionBase {
  type: "TRUE_FALSE";
  payload: {
    statement: string;
  };
}

export interface PublicIdentificationQuestion extends PublicQuestionBase {
  type: "IDENTIFICATION";
  payload: {
    prompt: string;
  };
}

export interface PublicEnumerationQuestion extends PublicQuestionBase {
  type: "ENUMERATION";
  payload: {
    prompt: string;
    requiredCount: number;
    orderMatters: boolean;
  };
}

export type PublicQuestion =
  | PublicMultipleChoiceQuestion
  | PublicTrueFalseQuestion
  | PublicIdentificationQuestion
  | PublicEnumerationQuestion;

export interface PublicQuestionByType {
  MULTIPLE_CHOICE: PublicMultipleChoiceQuestion;
  TRUE_FALSE: PublicTrueFalseQuestion;
  IDENTIFICATION: PublicIdentificationQuestion;
  ENUMERATION: PublicEnumerationQuestion;
}
