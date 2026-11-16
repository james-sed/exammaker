"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  HelpCircle,
  Users,
  Edit,
  Share2,
  Trash2,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareLinkModal } from "./ShareLinkModal";
import { togglePublish } from "../actions/togglePublish";
import { deleteQuiz } from "../actions/deleteQuiz";
import type { QuizSettingsData } from "../schemas/quiz.schema";
import type { QuizStatus } from "../types/quiz.types";

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description?: string | null;
    status: QuizStatus;
    shareId: string;
    settings: QuizSettingsData;
    _count?: {
      questions: number;
      attempts: number;
    };
  };
}

export function QuizCard({ quiz }: QuizCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<QuizStatus>(quiz.status);
  const [publishError, setPublishError] = useState<string | null>(null);

  const isPublished = status === "PUBLISHED";

  const handleTogglePublish = async () => {
    setIsPublishing(true);
    setPublishError(null);
    const res = await togglePublish(quiz.id);
    if (res.success && res.status) {
      setStatus(res.status);
    } else {
      setPublishError(res.error || "Could not update the quiz.");
    }
    setIsPublishing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${quiz.title}"? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    await deleteQuiz(quiz.id);
    setIsDeleting(false);
  };

  return (
    <>
      <Card className="flex flex-col justify-between border-border transition-shadow duration-150 ease-out hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg font-bold text-foreground">
              {quiz.title}
            </CardTitle>
            <Badge variant={isPublished ? "primary" : "neutral"}>
              {isPublished ? (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" aria-hidden="true" /> Published
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" aria-hidden="true" /> Draft
                </span>
              )}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {quiz.description || "No description provided."}
          </p>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1" title="Time limit">
              <Clock className="h-3.5 w-3.5 text-subtle-foreground" aria-hidden="true" />
              <span>
                {quiz.settings.timeLimitMinutes
                  ? `${quiz.settings.timeLimitMinutes} min`
                  : "Untimed"}
              </span>
            </div>

            <div className="flex items-center gap-1" title="Question count">
              <HelpCircle
                className="h-3.5 w-3.5 text-subtle-foreground"
                aria-hidden="true"
              />
              <span>{quiz._count?.questions ?? 0} questions</span>
            </div>

            <div className="flex items-center gap-1" title="Attempts">
              <Users className="h-3.5 w-3.5 text-subtle-foreground" aria-hidden="true" />
              <span>{quiz._count?.attempts ?? 0} attempts</span>
            </div>
          </div>

          {publishError && (
            <p className="mt-3 text-xs text-destructive-text" role="alert">
              {publishError}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <Link href={`/quizzes/${quiz.id}/edit`}>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <Edit className="h-3.5 w-3.5" aria-hidden="true" /> Edit
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setIsShareModalOpen(true)}
              disabled={!isPublished}
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" /> Share
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={isPublishing}
              onClick={handleTogglePublish}
            >
              {isPublishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : isPublished ? (
                "Unpublish"
              ) : (
                "Publish"
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-destructive-text hover:bg-destructive-tint"
              disabled={isDeleting}
              onClick={handleDelete}
              title="Delete quiz"
              aria-label={`Delete ${quiz.title}`}
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quizTitle={quiz.title}
        shareId={quiz.shareId}
      />
    </>
  );
}
