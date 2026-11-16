import type { PublicQuestion } from "../../questions/types/question.types";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export interface ActiveExamSession {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  startedAt: string;
  expiresAt: string | null;
  timeLimitMinutes: number | null;
  questions: PublicQuestion[];
  answers: Record<string, unknown>;
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
