import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { quizId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quiz = await db.quiz.findFirst({
    where: {
      id: params.quizId,
      ownerId: session.user.id,
    },
    select: { id: true, title: true },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(`Quiz export ${quiz.title}`, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
