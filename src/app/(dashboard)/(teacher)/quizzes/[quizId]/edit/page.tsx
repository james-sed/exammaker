import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart2, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getQuizById } from "@/features/quizzes/queries/getQuizById";
import { QuizSettingsForm } from "@/features/quizzes/components/QuizSettingsForm";

export const dynamic = "force-dynamic";

export default async function EditQuizPage({
  params,
}: {
  params: { quizId: string };
}) {
  const quiz = await getQuizById(params.quizId);

  if (!quiz) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/quizzes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {quiz.title}
              </h1>
              <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                {quiz.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created on {new Date(quiz.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/quizzes/${quiz.id}/analytics`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" /> View Analytics
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Quiz Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Quiz Settings</h2>
          <QuizSettingsForm initialData={quiz} />
        </div>

        {/* Right column: Questions Overview (Preview for Feature 3) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Questions ({quiz.questions?.length ?? 0})
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">
                  Question Builder
                </p>
                <p className="text-xs text-muted-foreground">
                  {quiz.questions?.length ?? 0} questions configured
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Add multiple choice, true/false, or short answer questions with points and explanations.
            </p>

            <div className="pt-2">
              <Button variant="outline" className="w-full flex items-center gap-2" disabled>
                <Plus className="h-4 w-4" /> Add Questions (Feature 3)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
