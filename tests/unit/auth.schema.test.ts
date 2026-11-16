import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "@/features/auth/schemas/auth.schema";

describe("registerSchema", () => {
  const valid = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "password123",
  };

  it("accepts a valid signup", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short7!" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("8 characters");
    }
  });

  it("rejects an invalid email", () => {
    expect(
      registerSchema.safeParse({ ...valid, email: "not-an-email" }).success
    ).toBe(false);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(registerSchema.safeParse({ ...valid, name: "J" }).success).toBe(false);
  });

  it("trims surrounding whitespace from name and email", () => {
    const result = registerSchema.parse({
      ...valid,
      name: "  Jane Doe  ",
      email: "  jane@example.com  ",
    });

    expect(result.name).toBe("Jane Doe");
    expect(result.email).toBe("jane@example.com");
  });

  it("does not accept a role field", () => {
    const parsed = registerSchema.parse({
      ...valid,
      role: "TEACHER",
    } as typeof valid);

    expect(parsed).not.toHaveProperty("role");
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(
      loginSchema.safeParse({
        email: "jane@example.com",
        password: "whatever",
      }).success
    ).toBe(true);
  });

  it("rejects a missing password", () => {
    expect(
      loginSchema.safeParse({ email: "jane@example.com", password: "" }).success
    ).toBe(false);
  });
});
