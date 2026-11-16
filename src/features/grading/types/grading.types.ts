import type { QuestionType } from "@/features/questions/schemas/question.schema";

export interface QuestionGradeResult {
  questionId: string;
  type: QuestionType;
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  /** Enumeration only: how many items matched. */
  matchedItems?: number;
  /** Enumeration only: how many items were required. */
  requiredItems?: number;
}

export interface AttemptGradeResult {
  results: QuestionGradeResult[];
  pointsEarned: number;
  pointsPossible: number;
  /** 0 to 100, rounded to two decimals. Zero when nothing is gradable. */
  percentage: number;
  correctCount: number;
  questionCount: number;
}
