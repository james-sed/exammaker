import { z } from "zod";

export const quizSettingsSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters long").max(100, "Title cannot exceed 100 characters"),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional(),
  timeLimitMinutes: z.coerce
    .number()
    .min(1, "Time limit must be at least 1 minute")
    .max(1440, "Time limit cannot exceed 24 hours")
    .nullable()
    .optional(),
  maxAttempts: z.coerce
    .number()
    .int()
    .min(1, "Must allow at least 1 attempt")
    .max(100, "Maximum attempt limit is 100")
    .default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

export type QuizSettingsInput = z.infer<typeof quizSettingsSchema>;
