import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (value: string) => `hashed:${value}`),
    compare: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { registerAction } from "@/features/auth/actions/registerAction";

const findUnique = vi.mocked(db.user.findUnique);
const create = vi.mocked(db.user.create);

const input = {
  name: "Jane Doe",
  email: "Jane@Example.com",
  password: "password123",
};

describe("registerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid input before touching the database", async () => {
    const result = await registerAction({ ...input, password: "short" });

    expect(result.success).toBe(false);
    expect(findUnique).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an email that is already registered", async () => {
    findUnique.mockResolvedValue({ id: "user_1" } as never);

    const result = await registerAction(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain("already exists");
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a user with a hashed password and no role", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "user_1" } as never);

    const result = await registerAction(input);

    expect(result.success).toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
    });

    const data = create.mock.calls[0]?.[0]?.data;
    expect(data).toEqual({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "hashed:password123",
    });
    expect(data).not.toHaveProperty("role");
  });
});
