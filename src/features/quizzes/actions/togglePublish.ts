"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface TogglePublishResult {
  success: boolean;
  status?: "DRAFT" | "PUBLISHED";
  error?: string;
}

export async function togglePublish(quizId: string): Promise<TogglePublishResult> {
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
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found." };
    }

    if (quiz.status === "DRAFT" && quiz._count.questions === 0) {
      return {
        success: false,
        error: "Add at least one question before publishing.",
      };
    }

    const nextStatus = quiz.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    const updated = await db.quiz.update({
      where: { id: quizId },
      data: {
        status: nextStatus,
        publishedAt: nextStatus === "PUBLISHED" ? new Date() : null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/quizzes");
    revalidatePath(`/quizzes/${quizId}/edit`);

    return {
      success: true,
      status: updated.status,
    };
  } catch (error) {
    console.error("Error toggling publish state:", error);
    return {
      success: false,
      error: "Failed to toggle quiz publish state.",
    };
  }
}
