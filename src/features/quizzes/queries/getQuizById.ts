import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
        include: {
          options: {
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  if (!quiz) {
    return null;
  }

  // Only the creator (or admin) can view the full quiz for editing
  if (quiz.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return null;
  }

  return quiz;
}
