export type UserRole = "TEACHER" | "STUDENT" | "ADMIN";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}
