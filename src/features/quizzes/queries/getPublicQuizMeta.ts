import { db } from "@/lib/db";
import { PublicQuizMeta } from "../types/quiz.types";

export async function getPublicQuizMeta(identifier: string): Promise<PublicQuizMeta | null> {
  const quiz = await db.quiz.findFirst({
    where: {
      OR: [
        { id: identifier },
        { shareCode: identifier },
      ],
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      description: true,
      timeLimitMinutes: true,
      maxAttempts: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!quiz) {
    return null;
  }

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    timeLimitMinutes: quiz.timeLimitMinutes,
    maxAttempts: quiz.maxAttempts,
    questionCount: quiz._count.questions,
  };
}
