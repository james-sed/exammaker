import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getQuizzesByTeacher() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const quizzes = await db.quiz.findMany({
    where: {
      authorId: session.user.id,
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

  return quizzes;
}
