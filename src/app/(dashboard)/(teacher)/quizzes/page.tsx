import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuizzesByTeacher } from "@/features/quizzes/queries/getQuizzesByTeacher";
import { QuizList } from "@/features/quizzes/components/QuizList";

export const dynamic = "force-dynamic";

export default async function TeacherQuizzesPage() {
  const quizzes = await getQuizzesByTeacher();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Quizzes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, manage, and share your exams and question sets.
          </p>
        </div>

        <Link href="/quizzes/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      <QuizList initialQuizzes={quizzes} />
    </div>
  );
}
