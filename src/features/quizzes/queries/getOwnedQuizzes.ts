import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseQuizSettings } from "../schemas/quiz.schema";

export async function getOwnedQuizzes() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const quizzes = await db.quiz.findMany({
    where: {
      ownerId: session.user.id,
    },
    include: {
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return quizzes.map((quiz) => ({
    ...quiz,
    settings: parseQuizSettings(quiz.settings),
  }));
}
