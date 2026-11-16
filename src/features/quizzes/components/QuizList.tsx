"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QuizCard } from "./QuizCard";
import type { QuizSettingsData } from "../schemas/quiz.schema";
import type { QuizStatus } from "../types/quiz.types";

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  status: QuizStatus;
  shareId: string;
  settings: QuizSettingsData;
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
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">(
    "ALL"
  );

  const filteredQuizzes = initialQuizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quiz.description &&
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === "PUBLISHED") return matchesSearch && quiz.status === "PUBLISHED";
    if (statusFilter === "DRAFT") return matchesSearch && quiz.status === "DRAFT";
    return matchesSearch;
  });

  if (initialQuizzes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary-tint-foreground">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No quizzes yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Create a quiz to choose its timer, attempt limit, and sharing options.
        </p>
        <div className="mt-6">
          <Link href="/quizzes/new">
            <Button className="mx-auto flex items-center gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" /> Create your first quiz
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-2.5 h-4 w-4 text-subtle-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search quizzes..."
            aria-label="Search quizzes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            variant={statusFilter === "ALL" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
          >
            All ({initialQuizzes.length})
          </Button>
          <Button
            variant={statusFilter === "PUBLISHED" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("PUBLISHED")}
          >
            Published (
            {initialQuizzes.filter((q) => q.status === "PUBLISHED").length})
          </Button>
          <Button
            variant={statusFilter === "DRAFT" ? "primary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("DRAFT")}
          >
            Drafts ({initialQuizzes.filter((q) => q.status === "DRAFT").length})
          </Button>
        </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No quizzes match your search &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
