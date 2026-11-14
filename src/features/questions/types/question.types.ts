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

export interface TeacherQuestionOptionView extends QuestionOptionView {
  isCorrect: boolean;
}

export interface StudentQuestionView {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  order: number;
  options: QuestionOptionView[]; // isCorrect is deliberately stripped
}

export interface TeacherQuestionView {
  id: string;
  type: QuestionType;
  prompt: string;
  explanation?: string | null;
  points: number;
  order: number;
  options: TeacherQuestionOptionView[];
}
