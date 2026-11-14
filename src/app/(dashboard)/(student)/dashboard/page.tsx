import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Student Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {session?.user?.name || "Student"}. Here are your available quizzes and recent activity.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-lg text-slate-900">Ready to take an exam?</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Paste a share link from your instructor, or view your past attempts in your history tab.
        </p>
        <div className="mt-6">
          <Link href="/history">
            <Button variant="outline">View Past Attempts</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
