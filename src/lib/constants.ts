export const APP_NAME = "ExamMaker";
export const APP_DESCRIPTION = "Turn your files into quizzes in minutes";

export const DEFAULT_QUIZ_TIME_LIMIT_MINUTES = 30;
export const SERVER_TIMER_GRACE_PERIOD_SECONDS = 30;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  QUIZZES: "/quizzes",
  NEW_QUIZ: "/quizzes/new",
  EDIT_QUIZ: (quizId: string) => `/quizzes/${quizId}/edit`,
  QUIZ_RESULTS: (quizId: string) => `/quizzes/${quizId}/results`,
  SHARE: (shareId: string) => `/q/${shareId}`,
  TAKE: (shareId: string, attemptId: string) =>
    `/q/${shareId}/take/${attemptId}`,
  TAKE_RESULTS: (shareId: string, attemptId: string) =>
    `/q/${shareId}/results/${attemptId}`,
  SETTINGS: "/settings",
} as const;
