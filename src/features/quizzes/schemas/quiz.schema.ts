import { z } from "zod";

export const quizSettingsDataSchema = z.object({
  timeLimitMinutes: z
    .number()
    .int()
    .min(1, "Time limit must be at least 1 minute")
    .max(1440, "Time limit cannot exceed 24 hours")
    .nullable()
    .default(null),
  attemptLimit: z
    .number()
    .int()
    .min(1, "Must allow at least 1 attempt")
    .max(100, "Maximum attempt limit is 100")
    .default(1),
  shuffleOptions: z.boolean().default(false),
});

export type QuizSettingsData = z.infer<typeof quizSettingsDataSchema>;

export const defaultQuizSettings: QuizSettingsData = {
  timeLimitMinutes: null,
  attemptLimit: 1,
  shuffleOptions: false,
};

/** Reads a Json column safely; bad data falls back to defaults. */
export function parseQuizSettings(value: unknown): QuizSettingsData {
  const result = quizSettingsDataSchema.safeParse(value);
  return result.success ? result.data : defaultQuizSettings;
}

export const quizSettingsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  timeLimitMinutes: z.coerce
    .number()
    .int()
    .min(1, "Time limit must be at least 1 minute")
    .max(1440, "Time limit cannot exceed 24 hours")
    .nullable()
    .optional(),
  attemptLimit: z.coerce
    .number()
    .int()
    .min(1, "Must allow at least 1 attempt")
    .max(100, "Maximum attempt limit is 100")
    .default(1),
  shuffleOptions: z.boolean().default(false),
});

export type QuizSettingsInput = z.infer<typeof quizSettingsSchema>;
