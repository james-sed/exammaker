import { z } from "zod";

/**
 * The four supported question types. This array is the single source of
 * truth for the type literal union used across schemas, grading, and the
 * question registry.
 */
export const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "IDENTIFICATION",
  "ENUMERATION",
] as const;

export const questionTypeSchema = z.enum(QUESTION_TYPES);

/** Shared columns stored on every Question row. */
export const questionBaseSchema = z.object({
  id: z.string().trim().min(1),
  quizId: z.string().trim().min(1),
  position: z.number().int().nonnegative(),
  points: z.number().positive().default(1),
  sourceExcerpt: z.string().trim().min(1).nullable().default(null),
});

const promptSchema = z
  .string()
  .trim()
  .min(3, "Question prompt must be at least 3 characters long");

const explanationSchema = z.string().trim().min(1).nullish();

// ---------------------------------------------------------------------------
// Payloads (the JSON stored in Question.payload). These deliberately exclude
// the shared columns so they can be validated independently during generation.
// ---------------------------------------------------------------------------

export const multipleChoicePayloadSchema = z.object({
  prompt: promptSchema,
  options: z
    .array(z.string().trim().min(1, "Option text cannot be empty"))
    .min(2, "Multiple choice questions must have at least 2 options")
    .max(6, "Multiple choice questions can have at most 6 options"),
  correctOptionIndex: z.number().int().nonnegative(),
  explanation: explanationSchema,
});

export const trueFalsePayloadSchema = z.object({
  statement: z
    .string()
    .trim()
    .min(3, "True/false statement must be at least 3 characters long"),
  answer: z.boolean(),
  explanation: explanationSchema,
});

export const identificationPayloadSchema = z.object({
  prompt: promptSchema,
  acceptedAnswers: z
    .array(z.string().trim().min(1, "Accepted answers cannot be empty"))
    .min(1, "Provide at least one accepted answer"),
  caseSensitive: z.boolean().default(false),
  explanation: explanationSchema,
});

export const enumerationPayloadSchema = z.object({
  prompt: promptSchema,
  expectedItems: z
    .array(z.string().trim().min(1, "Expected items cannot be empty"))
    .min(1, "Provide at least one expected item"),
  requiredCount: z.number().int().positive(),
  orderMatters: z.boolean().default(false),
  explanation: explanationSchema,
});

/** Payload union keyed by `type`, for parsing a stored `payload` column. */
export const questionPayloadSchema = z.discriminatedUnion("type", [
  z
    .object({ type: z.literal("MULTIPLE_CHOICE") })
    .extend(multipleChoicePayloadSchema.shape),
  z
    .object({ type: z.literal("TRUE_FALSE") })
    .extend(trueFalsePayloadSchema.shape),
  z
    .object({ type: z.literal("IDENTIFICATION") })
    .extend(identificationPayloadSchema.shape),
  z
    .object({ type: z.literal("ENUMERATION") })
    .extend(enumerationPayloadSchema.shape),
]);

const payloadSchemas = {
  MULTIPLE_CHOICE: multipleChoicePayloadSchema,
  TRUE_FALSE: trueFalsePayloadSchema,
  IDENTIFICATION: identificationPayloadSchema,
  ENUMERATION: enumerationPayloadSchema,
} satisfies Record<QuestionType, z.ZodTypeAny>;

// ---------------------------------------------------------------------------
// Full questions: shared columns + discriminant + payload.
// ---------------------------------------------------------------------------

export const multipleChoiceQuestionSchema = questionBaseSchema.extend({
  type: z.literal("MULTIPLE_CHOICE"),
  payload: multipleChoicePayloadSchema,
});

export const trueFalseQuestionSchema = questionBaseSchema.extend({
  type: z.literal("TRUE_FALSE"),
  payload: trueFalsePayloadSchema,
});

export const identificationQuestionSchema = questionBaseSchema.extend({
  type: z.literal("IDENTIFICATION"),
  payload: identificationPayloadSchema,
});

export const enumerationQuestionSchema = questionBaseSchema.extend({
  type: z.literal("ENUMERATION"),
  payload: enumerationPayloadSchema,
});

export const questionSchema = z
  .discriminatedUnion("type", [
    multipleChoiceQuestionSchema,
    trueFalseQuestionSchema,
    identificationQuestionSchema,
    enumerationQuestionSchema,
  ])
  .superRefine((question, ctx) => {
    if (question.type === "MULTIPLE_CHOICE") {
      const { correctOptionIndex, options } = question.payload;

      if (correctOptionIndex >= options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["payload", "correctOptionIndex"],
          message: "Correct option index must point at an existing option",
        });
      }
    }

    if (question.type === "ENUMERATION") {
      const { requiredCount, expectedItems } = question.payload;

      if (requiredCount > expectedItems.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["payload", "requiredCount"],
          message: "Required count cannot exceed the number of expected items",
        });
      }
    }
  });

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type QuestionBase = z.infer<typeof questionBaseSchema>;

export type MultipleChoicePayload = z.infer<typeof multipleChoicePayloadSchema>;
export type TrueFalsePayload = z.infer<typeof trueFalsePayloadSchema>;
export type IdentificationPayload = z.infer<typeof identificationPayloadSchema>;
export type EnumerationPayload = z.infer<typeof enumerationPayloadSchema>;
export type QuestionPayload = z.infer<typeof questionPayloadSchema>;

export type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof trueFalseQuestionSchema>;
export type IdentificationQuestion = z.infer<typeof identificationQuestionSchema>;
export type EnumerationQuestion = z.infer<typeof enumerationQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;

/**
 * Validates the JSON `payload` for a question type and returns it with the
 * discriminant attached. Returns null on invalid data so callers can report
 * a dropped question instead of throwing.
 */
export function parseQuestionPayload(
  type: QuestionType,
  payload: unknown
): QuestionPayload | null {
  const schema = payloadSchemas[type];
  const result = schema.safeParse(payload);

  if (!result.success) {
    return null;
  }

  return { type, ...result.data } as QuestionPayload;
}
