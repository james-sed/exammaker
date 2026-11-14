"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  HelpCircle,
  Users,
  Edit,
  BarChart2,
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

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description?: string | null;
    timeLimitMinutes?: number | null;
    maxAttempts: number;
    isPublished: boolean;
    shareCode: string;
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
  const [isPublished, setIsPublished] = useState(quiz.isPublished);

  const handleTogglePublish = async () => {
    setIsPublishing(true);
    const res = await togglePublish(quiz.id);
    if (res.success && typeof res.isPublished === "boolean") {
      setIsPublished(res.isPublished);
    }
    setIsPublishing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${quiz.title}"? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    await deleteQuiz(quiz.id);
    setIsDeleting(false);
  };

  return (
    <>
      <Card className="flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">
              {quiz.title}
            </CardTitle>
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Published
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Draft
                </span>
              )}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {quiz.description || "No description provided."}
          </p>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1" title="Time Limit">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : "Untimed"}
              </span>
            </div>

            <div className="flex items-center gap-1" title="Question Count">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              <span>{quiz._count?.questions ?? 0} questions</span>
            </div>

            <div className="flex items-center gap-1" title="Total Attempts">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span>{quiz._count?.attempts ?? 0} attempts</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link href={`/quizzes/${quiz.id}/edit`}>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            </Link>

            <Link href={`/quizzes/${quiz.id}/analytics`}>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <BarChart2 className="h-3.5 w-3.5 mr-1" /> Analytics
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5 mr-1" /> Share
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isPublished ? (
                "Unpublish"
              ) : (
                "Publish"
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              disabled={isDeleting}
              onClick={handleDelete}
              title="Delete Quiz"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        quizTitle={quiz.title}
        shareCode={quiz.shareCode}
      />
    </>
  );
}
