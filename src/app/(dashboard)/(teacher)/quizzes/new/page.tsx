import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizSettingsForm } from "@/features/quizzes/components/QuizSettingsForm";

export default function NewQuizPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/quizzes">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create a New Quiz
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure assessment settings, timers, and attempt limits.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <QuizSettingsForm />
      </div>
    </div>
  );
}
