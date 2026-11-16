export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "MATCHING";

export interface QuestionOptionView {
  id: string;
  text: string;
  order: number;
}

/** Owner view: includes the answer key. Never send this to a taker. */
export interface OwnerQuestionOptionView extends QuestionOptionView {
  isCorrect: boolean;
}

/** Taker view: the answer key is deliberately stripped. */
export interface TakerQuestionView {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  order: number;
  options: QuestionOptionView[];
}

export interface OwnerQuestionView {
  id: string;
  type: QuestionType;
  prompt: string;
  explanation?: string | null;
  points: number;
  order: number;
  options: OwnerQuestionOptionView[];
}
