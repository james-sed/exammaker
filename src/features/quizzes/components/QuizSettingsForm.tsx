"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Clock, Shuffle, CheckSquare } from "lucide-react";
import { quizSettingsSchema, QuizSettingsInput } from "../schemas/quiz.schema";
import { createQuiz } from "../actions/createQuiz";
import { updateQuiz } from "../actions/updateQuiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QuizSettingsFormProps {
  initialData?: {
    id: string;
    title: string;
    description?: string | null;
    timeLimitMinutes?: number | null;
    maxAttempts: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    isPublished: boolean;
  };
}

export function QuizSettingsForm({ initialData }: QuizSettingsFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasTimeLimit, setHasTimeLimit] = useState(Boolean(initialData?.timeLimitMinutes));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuizSettingsInput>({
    resolver: zodResolver(quizSettingsSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      timeLimitMinutes: initialData?.timeLimitMinutes ?? 30,
      maxAttempts: initialData?.maxAttempts ?? 1,
      shuffleQuestions: initialData?.shuffleQuestions ?? false,
      shuffleOptions: initialData?.shuffleOptions ?? false,
      isPublished: initialData?.isPublished ?? false,
    },
  });

  const isPublished = watch("isPublished");
  const shuffleQuestions = watch("shuffleQuestions");
  const shuffleOptions = watch("shuffleOptions");

  const onSubmit = async (data: QuizSettingsInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload: QuizSettingsInput = {
      ...data,
      timeLimitMinutes: hasTimeLimit ? data.timeLimitMinutes : null,
    };

    if (isEditing && initialData) {
      const res = await updateQuiz(initialData.id, payload);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to update quiz settings");
        setIsLoading(false);
        return;
      }
      setSuccessMessage("Quiz settings updated successfully!");
      setIsLoading(false);
      router.refresh();
    } else {
      const res = await createQuiz(payload);
      if (!res.success || !res.quizId) {
        setErrorMessage(res.error || "Failed to create quiz");
        setIsLoading(false);
        return;
      }
      // Redirect to edit page where teacher can add questions
      router.push(`/quizzes/${res.quizId}/edit`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">General Information</CardTitle>
          <CardDescription>
            Specify the title and instructions for students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Biology Midterm Exam - Fall 2026"
              disabled={isLoading}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Instructions / Description</Label>
            <Textarea
              id="description"
              placeholder="Add instructions, guidelines, or topics covered in this assessment..."
              rows={4}
              disabled={isLoading}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timing and Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Timing &amp; Attempt Rules
          </CardTitle>
          <CardDescription>
            Configure time limits and how many times a student can take this quiz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Enforce Time Limit</Label>
                <p className="text-xs text-muted-foreground">
                  Submissions after this time expires will be blocked or auto-graded.
                </p>
              </div>
              <input
                type="checkbox"
                checked={hasTimeLimit}
                onChange={(e) => {
                  setHasTimeLimit(e.target.checked);
                  if (e.target.checked && !watch("timeLimitMinutes")) {
                    setValue("timeLimitMinutes", 30);
                  }
                }}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {hasTimeLimit && (
              <div className="pl-4 border-l-2 border-primary/20 space-y-2 pt-1">
                <Label htmlFor="timeLimitMinutes">Duration (in minutes)</Label>
                <div className="flex items-center gap-2 max-w-xs">
                  <Input
                    id="timeLimitMinutes"
                    type="number"
                    min={1}
                    max={1440}
                    disabled={isLoading}
                    {...register("timeLimitMinutes")}
                  />
                  <span className="text-sm text-slate-500">minutes</span>
                </div>
                {errors.timeLimitMinutes && (
                  <p className="text-xs text-red-500">{errors.timeLimitMinutes.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label htmlFor="maxAttempts">Maximum Allowed Attempts</Label>
            <p className="text-xs text-muted-foreground">
              Number of times a student can take this exam (default: 1).
            </p>
            <Input
              id="maxAttempts"
              type="number"
              min={1}
              max={100}
              className="max-w-xs"
              disabled={isLoading}
              {...register("maxAttempts")}
            />
            {errors.maxAttempts && (
              <p className="text-xs text-red-500">{errors.maxAttempts.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Anti-Cheating & Randomization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-primary" /> Randomization &amp; Shuffling
          </CardTitle>
          <CardDescription>
            Prevent cheating by presenting questions and choices in randomized order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(e) => setValue("shuffleQuestions", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">
                Shuffle Questions
              </span>
              <p className="text-xs text-muted-foreground">
                Each student receives questions in a different randomized order.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(e) => setValue("shuffleOptions", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">
                Shuffle Answer Choices
              </span>
              <p className="text-xs text-muted-foreground">
                Answer options within Multiple Choice questions are shuffled randomly.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Publishing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" /> Publication Status
          </CardTitle>
          <CardDescription>
            Published quizzes can be accessed by students with the link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setValue("isPublished", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">
                Publish this quiz immediately
              </span>
              <p className="text-xs text-muted-foreground">
                When unchecked, the quiz remains a private draft.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/quizzes")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[140px]">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create & Add Questions"
          )}
        </Button>
      </div>
    </form>
  );
}
