import type { ComponentType } from "react";
import type { ZodTypeAny } from "zod";

import {
  gradeEnumeration,
  gradeIdentification,
  gradeMultipleChoice,
  gradeTrueFalse,
} from "@/features/grading/graders";
import type { QuestionGradeResult } from "@/features/grading/types/grading.types";
import { EnumerationEditor } from "./components/editors/EnumerationEditor";
import { IdentificationEditor } from "./components/editors/IdentificationEditor";
import { McqEditor } from "./components/editors/McqEditor";
import { TrueFalseEditor } from "./components/editors/TrueFalseEditor";
import {
  toPublicEnumerationQuestion,
  toPublicIdentificationQuestion,
  toPublicMultipleChoiceQuestion,
  toPublicTrueFalseQuestion,
} from "./mappers/publicQuestion";
import {
  enumerationQuestionSchema,
  identificationQuestionSchema,
  multipleChoiceQuestionSchema,
  trueFalseQuestionSchema,
  type EnumerationQuestion,
  type IdentificationQuestion,
  type MultipleChoiceQuestion,
  type Question,
  type QuestionType,
  type TrueFalseQuestion,
} from "./schemas/question.schema";
import type { PublicQuestion } from "./types/question.types";

/**
 * The one place where a question type is wired together: its schema, grader,
 * public-question mapper, and editor. To add a type, add its artifacts and one
 * entry below.
 */
export interface QuestionTypeDefinition {
  schema: ZodTypeAny;
  toPublic: (question: Question) => PublicQuestion;
  grade: (question: Question, submission: unknown) => QuestionGradeResult;
  editor: ComponentType;
}

export const questionRegistry = {
  MULTIPLE_CHOICE: {
    schema: multipleChoiceQuestionSchema,
    toPublic: (question) =>
      toPublicMultipleChoiceQuestion(question as MultipleChoiceQuestion),
    grade: (question, submission) =>
      gradeMultipleChoice(question as MultipleChoiceQuestion, submission),
    editor: McqEditor,
  },
  TRUE_FALSE: {
    schema: trueFalseQuestionSchema,
    toPublic: (question) =>
      toPublicTrueFalseQuestion(question as TrueFalseQuestion),
    grade: (question, submission) =>
      gradeTrueFalse(question as TrueFalseQuestion, submission),
    editor: TrueFalseEditor,
  },
  IDENTIFICATION: {
    schema: identificationQuestionSchema,
    toPublic: (question) =>
      toPublicIdentificationQuestion(question as IdentificationQuestion),
    grade: (question, submission) =>
      gradeIdentification(question as IdentificationQuestion, submission),
    editor: IdentificationEditor,
  },
  ENUMERATION: {
    schema: enumerationQuestionSchema,
    toPublic: (question) =>
      toPublicEnumerationQuestion(question as EnumerationQuestion),
    grade: (question, submission) =>
      gradeEnumeration(question as EnumerationQuestion, submission),
    editor: EnumerationEditor,
  },
} satisfies Record<QuestionType, QuestionTypeDefinition>;

export function getQuestionDefinition(
  type: QuestionType
): QuestionTypeDefinition {
  return questionRegistry[type];
}
