import type { Question } from "@/features/questions/schemas/question.schema";
import { gradeQuestion } from "../graders";
import type {
  AttemptGradeResult,
  QuestionGradeResult,
} from "../types/grading.types";

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Grades a whole attempt. Pure: no database, network, or clock access.
 *
 * `submissions` is keyed by question id. Questions with no submission, an
 * invalid submission, or malformed data score zero. The function never throws.
 */
export function gradeAttempt(
  questions: Question[],
  submissions: Record<string, unknown> = {}
): AttemptGradeResult {
  const results: QuestionGradeResult[] = questions.map((question) => {
    try {
      return gradeQuestion(question, submissions[question.id]);
    } catch {
      // Defensive: a malformed question from the database must not break
      // grading for the rest of the attempt.
      return {
        questionId: question.id,
        type: question.type,
        isCorrect: false,
        pointsEarned: 0,
        pointsPossible: 0,
      };
    }
  });

  const pointsEarned = results.reduce(
    (total, result) => total + result.pointsEarned,
    0
  );
  const pointsPossible = results.reduce(
    (total, result) => total + result.pointsPossible,
    0
  );

  return {
    results,
    pointsEarned,
    pointsPossible,
    percentage:
      pointsPossible > 0 ? roundPercentage((pointsEarned / pointsPossible) * 100) : 0,
    correctCount: results.filter((result) => result.isCorrect).length,
    questionCount: results.length,
  };
}
