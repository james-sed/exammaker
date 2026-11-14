"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quizSettingsSchema, QuizSettingsInput } from "../schemas/quiz.schema";

export interface CreateQuizResult {
  success: boolean;
  quizId?: string;
  error?: string;
}

export async function createQuiz(input: QuizSettingsInput): Promise<CreateQuizResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return { success: false, error: "Forbidden. Only teachers can create quizzes." };
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

    const quiz = await db.quiz.create({
      data: {
        title,
        description: description || null,
        timeLimitMinutes: timeLimitMinutes || null,
        maxAttempts,
        shuffleQuestions,
        shuffleOptions,
        isPublished,
        shareCode: nanoid(10),
        authorId: session.user.id,
      },
    });

    revalidatePath("/quizzes");

    return {
      success: true,
      quizId: quiz.id,
    };
  } catch (error) {
    console.error("Error creating quiz:", error);
    return {
      success: false,
      error: "Failed to create quiz. Please try again.",
    };
  }
}
