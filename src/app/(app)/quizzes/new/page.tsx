import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizSettingsForm } from "@/features/quizzes/components/QuizSettingsForm";
import { requireUser } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function NewQuizPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/quizzes">
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Back to quizzes">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create a quiz
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Set the timer, attempt limit, and option shuffling.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <QuizSettingsForm />
      </div>
    </div>
  );
}
