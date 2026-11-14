"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema, RegisterInput } from "../schemas/auth.schema";

export interface AuthActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function registerAction(input: RegisterInput): Promise<AuthActionResult> {
  try {
    const validated = registerSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Invalid input data",
      };
    }

    const { name, email, password, role } = validated.data;
    const normalizedEmail = email.toLowerCase();

    // Check for existing user
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email address already exists.",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
      },
    });

    return {
      success: true,
      message: "Account created successfully! You can now log in.",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during registration. Please try again.",
    };
  }
}
