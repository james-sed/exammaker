import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseQuizSettings } from "../schemas/quiz.schema";

export async function getQuizById(quizId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const quiz = await db.quiz.findUnique({
    where: {
      id: quizId,
    },
    include: {
      questions: {
        orderBy: {
          position: "asc",
        },
      },
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  if (!quiz || quiz.ownerId !== session.user.id) {
    return null;
  }

  return {
    ...quiz,
    settings: parseQuizSettings(quiz.settings),
  };
}
