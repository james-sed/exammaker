import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeacherQuizzesPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Quizzes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {session?.user?.name || "Teacher"}. Create and manage your exams.
          </p>
        </div>
        <Link href="/quizzes/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <BookOpen className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-lg text-slate-900">No quizzes created yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Get started by creating your first quiz, setting a time limit, and adding questions.
        </p>
        <div className="mt-6">
          <Link href="/quizzes/new">
            <Button>Create Your First Quiz</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
