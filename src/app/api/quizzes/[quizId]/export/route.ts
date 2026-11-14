import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { quizId: string } }
) {
  return new NextResponse(`Quiz Export ${params.quizId}`, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
