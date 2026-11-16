import type { QuizSettingsData } from "../schemas/quiz.schema";

export type QuizStatus = "DRAFT" | "PUBLISHED";

export interface QuizDetail {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  status: QuizStatus;
  shareId: string;
  settings: QuizSettingsData;
  questionsLockedAt?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    questions: number;
    attempts: number;
  };
}

export interface PublicQuizMeta {
  id: string;
  title: string;
  description?: string | null;
  shareId: string;
  settings: QuizSettingsData;
  questionCount: number;
}
