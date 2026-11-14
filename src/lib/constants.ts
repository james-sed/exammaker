export const APP_NAME = "ExamMaker";
export const APP_DESCRIPTION = "Modern quiz and exam maker web application";

export const DEFAULT_QUIZ_TIME_LIMIT_MINUTES = 30;
export const SERVER_TIMER_GRACE_PERIOD_SECONDS = 30;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  TEACHER: {
    QUIZZES: "/quizzes",
    NEW_QUIZ: "/quizzes/new",
    EDIT_QUIZ: (id: string) => `/quizzes/${id}/edit`,
    ANALYTICS: (id: string) => `/quizzes/${id}/analytics`,
    QUESTION_BANK: "/question-bank",
  },
  STUDENT: {
    DASHBOARD: "/dashboard",
    HISTORY: "/history",
  },
  EXAM: {
    TAKE: (id: string) => `/quiz/${id}/take`,
    RESULTS: (quizId: string, attemptId: string) => `/quiz/${quizId}/results/${attemptId}`,
  },
  SETTINGS: "/settings",
} as const;
