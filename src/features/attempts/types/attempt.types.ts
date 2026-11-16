import { TakerQuestionView } from "../../questions/types/question.types";

export type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EXPIRED"
  | "GRADED"
  | "NEEDS_REVIEW";

export interface ActiveExamSession {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  startedAt: string;
  expiresAt: string | null;
  timeLimitMinutes: number | null;
  questions: TakerQuestionView[];
  answers: Record<string, { selectedOptionId?: string | null; textAnswer?: string | null }>;
}

export interface AttemptResultSummary {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  status: AttemptStatus;
  score: number;
  maxScore: number;
  percentage: number;
  startedAt: string;
  submittedAt: string | null;
}
