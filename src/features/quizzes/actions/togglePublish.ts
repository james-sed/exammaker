"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface TogglePublishResult {
  success: boolean;
  isPublished?: boolean;
  error?: string;
}

export async function togglePublish(quizId: string): Promise<TogglePublishResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: { authorId: true, isPublished: true },
    });

    if (!quiz) {
      return { success: false, error: "Quiz not found." };
    }

    if (quiz.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, error: "Forbidden. You can only publish your own quizzes." };
    }

    const updated = await db.quiz.update({
      where: { id: quizId },
      data: { isPublished: !quiz.isPublished },
    });

    revalidatePath("/quizzes");
    revalidatePath(`/quizzes/${quizId}/edit`);

    return {
      success: true,
      isPublished: updated.isPublished,
    };
  } catch (error) {
    console.error("Error toggling publish state:", error);
    return {
      success: false,
      error: "Failed to toggle quiz publish state.",
    };
  }
}
