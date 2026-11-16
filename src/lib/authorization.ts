import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Returns the signed-in user or redirects to the sign-in page.
 * Use in server components and server actions that always need a user.
 */
export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}

/**
 * Returns the quiz only when the signed-in user owns it.
 * Returns null for both "not found" and "not yours" so callers cannot
 * use the response to probe for other users' quiz ids.
 */
export async function findOwnedQuiz(quizId: string) {
  const user = await requireUser();

  return db.quiz.findFirst({
    where: {
      id: quizId,
      ownerId: user.id,
    },
  });
}

/** Server-component variant: renders 404 when the quiz is missing or not owned. */
export async function requireOwnedQuiz(quizId: string) {
  const quiz = await findOwnedQuiz(quizId);

  if (!quiz) {
    notFound();
  }

  return quiz;
}

/** Boolean check for server actions that need a result instead of a throw. */
export async function isQuizOwner(quizId: string, userId: string) {
  const quiz = await db.quiz.findFirst({
    where: {
      id: quizId,
      ownerId: userId,
    },
    select: { id: true },
  });

  return Boolean(quiz);
}
