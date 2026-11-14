import Link from "next/link";
import {
  CheckSquare,
  ShieldCheck,
  Timer,
  BarChart3,
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  const dashboardUrl = user?.role === "TEACHER" ? "/quizzes" : "/dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-slate-50 to-slate-100">
      {/* Navigation */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-white shadow-sm">
              <CheckSquare className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              {APP_NAME}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href={dashboardUrl}>
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Generation Exam & Quiz Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight sm:leading-tight">
          Create, Conduct, and Grade Quizzes{" "}
          <span className="text-primary">Without Friction</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl">
          A modern assessment platform built for educators and students. Enjoy server-enforced timers, flexible question types, instant auto-grading, and seamless shareable links.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-base shadow-md">
              Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              Student / Teacher Sign In
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left w-full">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Timer className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              Server-Enforced Timers
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Prevent client-side manipulation. Deadlines and durations are verified strictly on the server upon submission.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              Instant Auto-Grading
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Scores and feedbacks are calculated server-side in milliseconds for multiple-choice, true/false, and short-answer questions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              Role-Based Control
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Dedicated interfaces tailored for teachers creating exams and students taking attempts with clear past history.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}
