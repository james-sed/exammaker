import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

// Anything that signals the removed Teacher/Student role system. ARIA `role="..."`
// attributes are allowed, so only the specific patterns below are rejected.
const FORBIDDEN = [
  /\buser\.role\b/,
  /\bsession\.user\.role\b/,
  /\bRoleGate\b/,
  /\bTEACHER\b/,
  /\bSTUDENT\b/,
  /\bADMIN\b/,
  /\bTeacher\w*/,
  /\bStudent\w*/,
  /\b(teacher|student)s?\b/i,
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

describe("role removal", () => {
  it("has no Teacher/Student references left in src", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(SRC)) {
      const text = readFileSync(file, "utf8");
      const lines = text.split(/\r?\n/);

      lines.forEach((line, index) => {
        if (FORBIDDEN.some((pattern) => pattern.test(line))) {
          offenders.push(`${relative(SRC, file)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
