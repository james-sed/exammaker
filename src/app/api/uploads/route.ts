import { auth } from "@/lib/auth";
import { listOwnedSourceFiles } from "@/features/uploads/queries/sourceFileQueries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { error: "Please sign in to view uploads." },
      { status: 401 }
    );
  }

  const limitParam = new URL(request.url).searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : 12;
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 50)
    : 12;

  try {
    const sources = await listOwnedSourceFiles(session.user.id, limit);
    return Response.json({ sources });
  } catch (error) {
    console.error("Failed to list uploads:", error);

    return Response.json(
      { error: "We couldn't load your uploads. Try again." },
      { status: 500 }
    );
  }
}
