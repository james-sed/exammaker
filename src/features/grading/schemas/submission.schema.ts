import { z } from "zod";

/**
 * Submission shapes, one per question type. These are the raw values the
 * taker's client sends; anything else is treated as unanswered and scores
 * zero rather than throwing.
 */

export const multipleChoiceSubmissionSchema = z.number().int().nonnegative();
export const trueFalseSubmissionSchema = z.boolean();
export const identificationSubmissionSchema = z.string();
export const enumerationSubmissionSchema = z.array(z.string());

export type MultipleChoiceSubmission = z.infer<
  typeof multipleChoiceSubmissionSchema
>;
export type TrueFalseSubmission = z.infer<typeof trueFalseSubmissionSchema>;
export type IdentificationSubmission = z.infer<
  typeof identificationSubmissionSchema
>;
export type EnumerationSubmission = z.infer<
  typeof enumerationSubmissionSchema
>;

export type QuestionSubmission =
  | MultipleChoiceSubmission
  | TrueFalseSubmission
  | IdentificationSubmission
  | EnumerationSubmission;

/** Submissions keyed by question id. Unknown/missing keys score zero. */
export type SubmissionMap = Record<string, unknown>;
