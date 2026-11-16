import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOwnedQuizzes } from "@/features/quizzes/queries/getOwnedQuizzes";
import { QuizList } from "@/features/quizzes/components/QuizList";
import { requireUser } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  await requireUser();
  const quizzes = await getOwnedQuizzes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, manage, and share your quizzes.
          </p>
        </div>

        <Link href="/quizzes/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create quiz
          </Button>
        </Link>
      </div>

      <QuizList initialQuizzes={quizzes} />
    </div>
  );
}
