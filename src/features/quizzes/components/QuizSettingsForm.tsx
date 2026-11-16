"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Clock, Shuffle } from "lucide-react";
import {
  quizSettingsSchema,
  QuizSettingsInput,
  QuizSettingsData,
  defaultQuizSettings,
} from "../schemas/quiz.schema";
import { createQuiz } from "../actions/createQuiz";
import { updateQuiz } from "../actions/updateQuiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuizSettingsFormProps {
  initialData?: {
    id: string;
    title: string;
    description?: string | null;
    settings: QuizSettingsData;
  };
}

export function QuizSettingsForm({ initialData }: QuizSettingsFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData);
  const settings = initialData?.settings ?? defaultQuizSettings;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasTimeLimit, setHasTimeLimit] = useState(
    Boolean(settings.timeLimitMinutes)
  );

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
      timeLimitMinutes: settings.timeLimitMinutes ?? 30,
      attemptLimit: settings.attemptLimit,
      shuffleOptions: settings.shuffleOptions,
    },
  });

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
      setSuccessMessage("Quiz settings updated.");
      setIsLoading(false);
      router.refresh();
    } else {
      const res = await createQuiz(payload);
      if (!res.success || !res.quizId) {
        setErrorMessage(res.error || "Failed to create quiz");
        setIsLoading(false);
        return;
      }
      router.push(`/quizzes/${res.quizId}/edit`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6" noValidate>
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive-fill/20 bg-destructive-tint p-4 text-sm text-destructive-tint-foreground"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-success-fill/20 bg-success-tint p-4 text-sm text-success-tint-foreground"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">General information</CardTitle>
          <CardDescription>Name the quiz and add instructions for takers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz title *</Label>
            <Input
              id="title"
              placeholder="e.g. Biology midterm review"
              disabled={isLoading}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              {...register("title")}
            />
            {errors.title && (
              <p id="title-error" className="text-xs text-destructive-text">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Instructions / description</Label>
            <Textarea
              id="description"
              placeholder="Add instructions, rules, or the topics covered..."
              rows={4}
              disabled={isLoading}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "description-error" : undefined}
              {...register("description")}
            />
            {errors.description && (
              <p id="description-error" className="text-xs text-destructive-text">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" /> Timing &amp;
            attempts
          </CardTitle>
          <CardDescription>
            Configure the time limit and how many attempts each taker gets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-semibold">Enforce time limit</Label>
                <p className="text-xs text-muted-foreground">
                  Late submissions are rejected or auto-submitted by the server.
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
                className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
                aria-label="Enforce time limit"
              />
            </div>

            {hasTimeLimit && (
              <div className="space-y-2 border-l-2 border-primary/20 pl-4 pt-1">
                <Label htmlFor="timeLimitMinutes">Duration (minutes)</Label>
                <div className="flex max-w-xs items-center gap-2">
                  <Input
                    id="timeLimitMinutes"
                    type="number"
                    min={1}
                    max={1440}
                    disabled={isLoading}
                    aria-invalid={Boolean(errors.timeLimitMinutes)}
                    aria-describedby={
                      errors.timeLimitMinutes ? "time-limit-error" : undefined
                    }
                    {...register("timeLimitMinutes")}
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                {errors.timeLimitMinutes && (
                  <p id="time-limit-error" className="text-xs text-destructive-text">
                    {errors.timeLimitMinutes.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label htmlFor="attemptLimit">Attempt limit</Label>
            <p className="text-xs text-muted-foreground">
              Maximum number of attempts per taker (default: 1).
            </p>
            <Input
              id="attemptLimit"
              type="number"
              min={1}
              max={100}
              className="max-w-xs"
              disabled={isLoading}
              aria-invalid={Boolean(errors.attemptLimit)}
              aria-describedby={errors.attemptLimit ? "attempt-limit-error" : undefined}
              {...register("attemptLimit")}
            />
            {errors.attemptLimit && (
              <p id="attempt-limit-error" className="text-xs text-destructive-text">
                {errors.attemptLimit.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Shuffle className="h-4 w-4 text-primary" aria-hidden="true" /> Option
            shuffling
          </CardTitle>
          <CardDescription>
            Present multiple-choice options in a different order for each attempt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(e) => setValue("shuffleOptions", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Shuffle options</span>
              <p className="text-xs text-muted-foreground">
                Does not change which option is correct.
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Create quiz"
          )}
        </Button>
      </div>
    </form>
  );
}
