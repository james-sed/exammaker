import { UploadWorkspace } from "@/features/uploads/components/UploadWorkspace";
import { listOwnedSourceFiles } from "@/features/uploads/queries/sourceFileQueries";
import { requireUser } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function NewQuizPage() {
  const user = await requireUser();
  const sources = await listOwnedSourceFiles(user.id, 12);

  return <UploadWorkspace userId={user.id} initialSources={sources} />;
}
