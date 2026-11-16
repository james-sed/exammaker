import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/authorization";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const quizCount = await db.quiz.count({
    where: { ownerId: user.id },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {user.name || "there"}. Your quizzes will appear here.
        </p>
      </div>

      {quizCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary-tint-foreground">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No quizzes yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Turn a PDF, DOCX, PPTX, or TXT file into a quiz. Upload and generation
            arrive in the next step.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/quizzes/new">
                Create a quiz
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            You have {quizCount} {quizCount === 1 ? "quiz" : "quizzes"}.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/quizzes">Open My Quizzes</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
