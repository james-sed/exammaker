import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, HelpCircle, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getQuizById } from "@/features/quizzes/queries/getQuizById";
import { QuizSettingsForm } from "@/features/quizzes/components/QuizSettingsForm";
import { requireUser } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function EditQuizPage({
  params,
}: {
  params: { quizId: string };
}) {
  await requireUser();
  const quiz = await getQuizById(params.quizId);

  if (!quiz) {
    notFound();
  }

  const isPublished = quiz.status === "PUBLISHED";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link href="/quizzes">
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Back to quizzes">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {quiz.title}
              </h1>
              <Badge variant={isPublished ? "primary" : "neutral"}>
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Created on {new Date(quiz.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-foreground">Quiz settings</h2>
          <QuizSettingsForm
            initialData={{
              id: quiz.id,
              title: quiz.title,
              description: quiz.description,
              settings: quiz.settings,
            }}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Questions ({quiz.questions.length})
          </h2>

          <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-tint text-primary-tint-foreground">
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Question builder</p>
                <p className="text-xs text-muted-foreground">
                  {quiz.questions.length} questions configured
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Adding, editing, and generating questions arrives in the next steps.
            </p>

            {quiz.questionsLockedAt && (
              <p className="flex items-start gap-2 rounded-lg bg-warning-tint p-3 text-xs text-warning-tint-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Questions are locked because attempts exist.
              </p>
            )}

            <Button variant="outline" className="w-full" disabled>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add questions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
