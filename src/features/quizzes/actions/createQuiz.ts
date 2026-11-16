"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quizSettingsSchema, QuizSettingsInput } from "../schemas/quiz.schema";

export interface CreateQuizResult {
  success: boolean;
  quizId?: string;
  error?: string;
}

function createShareId() {
  return randomBytes(18).toString("base64url");
}

export async function createQuiz(input: QuizSettingsInput): Promise<CreateQuizResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
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

    const quiz = await db.quiz.create({
      data: {
        title,
        description: description || null,
        shareId: createShareId(),
        ownerId: session.user.id,
        status: "DRAFT",
        settings: {
          timeLimitMinutes: timeLimitMinutes ?? null,
          attemptLimit,
          shuffleOptions,
        },
      },
    });

    revalidatePath("/dashboard");
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
