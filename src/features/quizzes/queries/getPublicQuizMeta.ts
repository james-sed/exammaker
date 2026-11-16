import { db } from "@/lib/db";
import { parseQuizSettings } from "../schemas/quiz.schema";
import { PublicQuizMeta } from "../types/quiz.types";

export async function getPublicQuizMeta(
  shareId: string
): Promise<PublicQuizMeta | null> {
  const quiz = await db.quiz.findFirst({
    where: {
      shareId,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      description: true,
      shareId: true,
      settings: true,
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
    shareId: quiz.shareId,
    settings: parseQuizSettings(quiz.settings),
    questionCount: quiz._count.questions,
  };
}
