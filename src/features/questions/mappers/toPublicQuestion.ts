import type { Question } from "../schemas/question.schema";
import type { PublicQuestion } from "../types/question.types";
import { getQuestionDefinition } from "../registry";

/**
 * The only supported way to hand a question to a quiz taker before
 * submission. Strips the answer key, accepted answers, expected items, and
 * explanations for the question's type.
 */
export function toPublicQuestion(question: Question): PublicQuestion {
  return getQuestionDefinition(question.type).toPublic(question);
}
