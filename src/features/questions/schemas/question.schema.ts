import { z } from "zod";

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, "Option text cannot be empty"),
  isCorrect: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const baseQuestionSchema = z.object({
  id: z.string().optional(),
  quizId: z.string(),
  prompt: z.string().trim().min(3, "Question prompt must be at least 3 characters"),
  explanation: z.string().trim().optional(),
  points: z.coerce.number().min(0.5, "Points must be at least 0.5").max(100).default(1),
  order: z.number().int().default(0),
});

export const mcqQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("MULTIPLE_CHOICE"),
  options: z
    .array(questionOptionSchema)
    .min(2, "Multiple choice questions must have at least 2 options")
    .refine((opts) => opts.some((o) => o.isCorrect), {
      message: "At least one option must be marked as correct",
    }),
});

export const trueFalseQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("TRUE_FALSE"),
  options: z
    .array(questionOptionSchema)
    .length(2, "True/False questions must have exactly 2 options (True and False)")
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
      message: "Exactly one option must be marked as correct",
    }),
});

export const shortAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal("SHORT_ANSWER"),
  options: z
    .array(questionOptionSchema)
    .min(1, "Please provide at least one accepted correct answer"),
});

export const questionSchema = z.discriminatedUnion("type", [
  mcqQuestionSchema,
  trueFalseQuestionSchema,
  shortAnswerQuestionSchema,
]);

export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
