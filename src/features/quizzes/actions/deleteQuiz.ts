"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface DeleteQuizResult {
  success: boolean;
  error?: string;
}

export async function deleteQuiz(quizId: string): Promise<DeleteQuizResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: { authorId: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found." };
    }

    if (quiz.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Forbidden. You can only delete your own quizzes." };
    }

    await db.quiz.delete({
      where: { id: quizId },
    });

    revalidatePath("/quizzes");

    return { success: true };
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return {
      success: false,
      error: "Failed to delete quiz. Please try again.",
    };
  }
}
