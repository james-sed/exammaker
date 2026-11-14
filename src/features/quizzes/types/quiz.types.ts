export interface QuizDetail {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes?: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isPublished: boolean;
  shareCode: string;
  authorId: string;
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
  timeLimitMinutes?: number | null;
  questionCount: number;
  maxAttempts: number;
}
