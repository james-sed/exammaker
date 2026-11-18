import { auth } from "@/lib/auth";
import { getOwnedSourceFileDetail } from "@/features/uploads/queries/sourceFileQueries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { sourceFileId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { error: "Please sign in to view this upload." },
      { status: 401 }
    );
  }

  try {
    const source = await getOwnedSourceFileDetail(
      params.sourceFileId,
      session.user.id
    );

    if (!source) {
      return Response.json(
        { error: "Upload not found." },
        { status: 404 }
      );
    }

    return Response.json({ source });
  } catch (error) {
    console.error("Failed to load upload:", error);

    return Response.json(
      { error: "We couldn't load that upload. Try again." },
      { status: 500 }
    );
  }
}
