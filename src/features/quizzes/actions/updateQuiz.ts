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

    const quiz = await db.quiz.findFirst({
      where: {
        id: quizId,
        ownerId: session.user.id,
      },
      select: { id: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found." };
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
      attemptLimit,
      shuffleOptions,
    } = validated.data;

    await db.quiz.update({
      where: { id: quizId },
      data: {
        title,
        description: description || null,
        settings: {
          timeLimitMinutes: timeLimitMinutes ?? null,
          attemptLimit,
          shuffleOptions,
        },
      },
    });

    revalidatePath("/dashboard");
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
