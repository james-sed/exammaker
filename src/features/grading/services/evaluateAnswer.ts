import { EvaluationResult } from "../types/grading.types";

export interface QuestionForGrading {
  id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "MATCHING";
  points: number;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export interface StudentAnswerInput {
  selectedOptionId?: string | null;
  textAnswer?: string | null;
}

/**
 * Pure evaluation function per question.
 * Evaluates student answer against question rubric and awards score.
 */
export function evaluateAnswer(
  question: QuestionForGrading,
  answer?: StudentAnswerInput | null
): EvaluationResult {
  const maxPoints = question.points ?? 1.0;

  if (!answer) {
    return { isCorrect: false, scoreAwarded: 0, maxPoints };
  }

  switch (question.type) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE": {
      if (!answer.selectedOptionId) {
        return { isCorrect: false, scoreAwarded: 0, maxPoints };
      }
      const matched = question.options.find(
        (opt) => opt.id === answer.selectedOptionId && opt.isCorrect
      );
      const isCorrect = Boolean(matched);
      return {
        isCorrect,
        scoreAwarded: isCorrect ? maxPoints : 0,
        maxPoints,
      };
    }

    case "SHORT_ANSWER": {
      const studentText = answer.textAnswer?.trim().toLowerCase();
      if (!studentText) {
        return { isCorrect: false, scoreAwarded: 0, maxPoints };
      }
      // Check against any option designated as an accepted correct answer
      const isCorrect = question.options.some((opt) => {
        const accepted = opt.text.trim().toLowerCase();
        return opt.isCorrect && accepted === studentText;
      });
      return {
        isCorrect,
        scoreAwarded: isCorrect ? maxPoints : 0,
        maxPoints,
      };
    }

    case "ESSAY":
      // Essay questions require manual review
      return { isCorrect: false, scoreAwarded: 0, maxPoints };

    default:
      return { isCorrect: false, scoreAwarded: 0, maxPoints };
  }
}
