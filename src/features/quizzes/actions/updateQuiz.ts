"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quizSettingsSchema, QuizSettingsInput } from "../schemas/quiz.schema";

export interface UpdateQuizResult {
  success: boolean;
  error?: string;
}

export async function updateQuiz(
  quizId: string,
  input: QuizSettingsInput
): Promise<UpdateQuizResult> {
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
      return { success: false, error: "Forbidden. You can only edit your own quizzes." };
    }

    const validated = quizSettingsSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Invalid quiz settings",
      };
    }

    const {
      title,
      description,
      timeLimitMinutes,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      isPublished,
    } = validated.data;

    await db.quiz.update({
      where: { id: quizId },
      data: {
        title,
        description: description || null,
        timeLimitMinutes: timeLimitMinutes || null,
        maxAttempts,
        shuffleQuestions,
        shuffleOptions,
        isPublished,
      },
    });

    revalidatePath("/quizzes");
    revalidatePath(`/quizzes/${quizId}/edit`);

    return { success: true };
  } catch (error) {
    console.error("Error updating quiz:", error);
    return {
      success: false,
      error: "Failed to update quiz settings. Please try again.",
    };
  }
}
