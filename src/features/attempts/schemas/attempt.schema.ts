import { z } from "zod";

export const recordAnswerSchema = z.object({
  attemptId: z.string(),
  questionId: z.string(),
  selectedOptionId: z.string().nullable().optional(),
  textAnswer: z.string().trim().nullable().optional(),
});

export const submitAttemptSchema = z.object({
  attemptId: z.string(),
});

export type RecordAnswerInput = z.infer<typeof recordAnswerSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
