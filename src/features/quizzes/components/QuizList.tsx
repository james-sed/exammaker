"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuizCard } from "./QuizCard";

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes?: number | null;
  maxAttempts: number;
  isPublished: boolean;
  shareCode: string;
  createdAt: Date;
  _count?: {
    questions: number;
    attempts: number;
  };
}

interface QuizListProps {
  initialQuizzes: QuizItem[];
}

export function QuizList({ initialQuizzes }: QuizListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  const filteredQuizzes = initialQuizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === "PUBLISHED") return matchesSearch && quiz.isPublished;
    if (statusFilter === "DRAFT") return matchesSearch && !quiz.isPublished;
    return matchesSearch;
  });

  if (initialQuizzes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <BookOpen className="h-6 w-6" />
        </div>
        <h3 className="font-semibold text-lg text-slate-900">No quizzes yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Create your first quiz to start adding questions, setting timers, and assessing students.
        </p>
        <div className="mt-6">
          <Link href="/quizzes/new">
            <Button className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" /> Create Your First Quiz
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={statusFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
          >
            All ({initialQuizzes.length})
          </Button>
          <Button
            variant={statusFilter === "PUBLISHED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("PUBLISHED")}
          >
            Published ({initialQuizzes.filter((q) => q.isPublished).length})
          </Button>
          <Button
            variant={statusFilter === "DRAFT" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("DRAFT")}
          >
            Drafts ({initialQuizzes.filter((q) => !q.isPublished).length})
          </Button>
        </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500">
          No quizzes match your search &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
