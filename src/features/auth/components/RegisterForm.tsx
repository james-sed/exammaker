"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { registerSchema, RegisterInput } from "../schemas/auth.schema";
import { registerAction } from "../actions/registerAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STUDENT",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await registerAction(data);

    if (!result.success) {
      setErrorMessage(result.error || "Failed to create account. Please try again.");
      setIsLoading(false);
      return;
    }

    setSuccessMessage(result.message || "Account registered successfully!");
    setIsLoading(false);

    // Redirect to login after brief delay
    setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Role Selection */}
      <div className="space-y-2">
        <Label>I want to use ExamMaker as a</Label>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setValue("role", "TEACHER", { shouldValidate: true })}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 p-3 text-center transition-all cursor-pointer",
              selectedRole === "TEACHER"
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
            )}
          >
            <BookOpen className="h-5 w-5 mb-1" />
            <span className="text-sm font-semibold">Teacher / Admin</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              Create & manage quizzes
            </span>
          </button>

          <button
            type="button"
            onClick={() => setValue("role", "STUDENT", { shouldValidate: true })}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 p-3 text-center transition-all cursor-pointer",
              selectedRole === "STUDENT"
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
            )}
          >
            <GraduationCap className="h-5 w-5 mb-1" />
            <span className="text-sm font-semibold">Student</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              Take exams & view scores
            </span>
          </button>
        </div>
        {errors.role && (
          <p className="text-xs text-red-500">{errors.role.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          disabled={isLoading}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="jane@example.com"
          autoComplete="email"
          disabled={isLoading}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            disabled={isLoading}
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground pt-2">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
}
