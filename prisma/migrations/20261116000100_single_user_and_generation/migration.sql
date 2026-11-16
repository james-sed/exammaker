-- Single-user rewrite.
--
-- User rows are preserved. The role column is dropped without deleting rows.
-- Existing Quiz shells are preserved and mapped to the new owner/settings model.
-- Legacy Question/QuestionOption/Attempt/Answer rows are dropped because their
-- shape is incompatible with the new payload-based question model. User accounts
-- (and quizzes) survive; old quiz content does not.

-- 1. Remove roles safely. User rows are untouched.
DROP INDEX IF EXISTS "User_role_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";
DROP TYPE IF EXISTS "Role";

-- 2. Drop legacy quiz content. Drop dependants first.
DROP TABLE IF EXISTS "Answer";
DROP TABLE IF EXISTS "QuestionOption";
DROP TABLE IF EXISTS "Attempt";
DROP TABLE IF EXISTS "Question";
DROP TYPE IF EXISTS "QuestionType";
DROP TYPE IF EXISTS "AttemptStatus";

-- 3. New enums.
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "SourceStatus" AS ENUM ('UPLOADED', 'EXTRACTING', 'GENERATING', 'READY', 'FAILED');
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'IDENTIFICATION', 'ENUMERATION');
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');
CREATE TYPE "GenerationStatus" AS ENUM ('QUEUED', 'EXTRACTING', 'GENERATING', 'READY', 'FAILED');

-- 4. Migrate Quiz in place so owner rows and quiz shells are preserved.
ALTER TABLE "Quiz" DROP CONSTRAINT IF EXISTS "Quiz_authorId_fkey";
DROP INDEX IF EXISTS "Quiz_shareCode_key";
DROP INDEX IF EXISTS "Quiz_authorId_idx";
DROP INDEX IF EXISTS "Quiz_shareCode_idx";
DROP INDEX IF EXISTS "Quiz_isPublished_idx";

ALTER TABLE "Quiz"
  ADD COLUMN "ownerId" TEXT,
  ADD COLUMN "shareId" TEXT,
  ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "questionsLockedAt" TIMESTAMP(3);

-- The new share id is generated for old rows. New rows get a cryptographic
-- random value from the application. gen_random_uuid() is available on PG13+.
UPDATE "Quiz"
SET
  "ownerId" = "authorId",
  "shareId" = replace(gen_random_uuid()::text, '-', ''),
  "settings" = jsonb_build_object(
    'timeLimitMinutes', "timeLimitMinutes",
    'attemptLimit', "maxAttempts",
    'shuffleOptions', "shuffleOptions"
  ),
  "status" = CASE
    WHEN "isPublished" THEN 'PUBLISHED'::"QuizStatus"
    ELSE 'DRAFT'::"QuizStatus"
  END,
  "publishedAt" = CASE
    WHEN "isPublished" THEN COALESCE("createdAt", CURRENT_TIMESTAMP)
    ELSE NULL
  END;

ALTER TABLE "Quiz"
  ALTER COLUMN "ownerId" SET NOT NULL,
  ALTER COLUMN "shareId" SET NOT NULL,
  DROP COLUMN "authorId",
  DROP COLUMN "shareCode",
  DROP COLUMN "isPublished",
  DROP COLUMN "maxAttempts",
  DROP COLUMN "shuffleOptions",
  DROP COLUMN "shuffleQuestions",
  DROP COLUMN "timeLimitMinutes";

CREATE UNIQUE INDEX "Quiz_shareId_key" ON "Quiz"("shareId");
CREATE INDEX "Quiz_ownerId_idx" ON "Quiz"("ownerId");
CREATE INDEX "Quiz_ownerId_createdAt_idx" ON "Quiz"("ownerId", "createdAt");
CREATE INDEX "Quiz_status_idx" ON "Quiz"("status");

ALTER TABLE "Quiz"
  ADD CONSTRAINT "Quiz_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. New source-file model.
CREATE TABLE "SourceFile" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "blobKey" TEXT,
    "status" "SourceStatus" NOT NULL DEFAULT 'UPLOADED',
    "errorReason" TEXT,
    "extractedText" TEXT,
    "pageCount" INTEGER,
    "charCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SourceFile_quizId_key" ON "SourceFile"("quizId");
CREATE INDEX "SourceFile_status_idx" ON "SourceFile"("status");
CREATE INDEX "SourceFile_createdAt_idx" ON "SourceFile"("createdAt");

ALTER TABLE "SourceFile"
  ADD CONSTRAINT "SourceFile_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. New question model.
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "payload" JSONB NOT NULL,
    "position" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sourceExcerpt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Question_quizId_idx" ON "Question"("quizId");
CREATE UNIQUE INDEX "Question_quizId_position_key" ON "Question"("quizId", "position");

ALTER TABLE "Question"
  ADD CONSTRAINT "Question_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. New anonymous attempt model. No user relation is required.
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "attemptToken" TEXT NOT NULL,
    "displayName" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attempt_attemptToken_key" ON "Attempt"("attemptToken");
CREATE INDEX "Attempt_quizId_idx" ON "Attempt"("quizId");
CREATE INDEX "Attempt_quizId_startedAt_idx" ON "Attempt"("quizId", "startedAt");
CREATE INDEX "Attempt_status_idx" ON "Attempt"("status");

ALTER TABLE "Attempt"
  ADD CONSTRAINT "Attempt_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. New answer model.
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "scoreAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Answer_attemptId_questionId_key" ON "Answer"("attemptId", "questionId");
CREATE INDEX "Answer_attemptId_idx" ON "Answer"("attemptId");
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");

ALTER TABLE "Answer"
  ADD CONSTRAINT "Answer_attemptId_fkey"
  FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Answer"
  ADD CONSTRAINT "Answer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Generation tracking: supports the rolling 24h limit, the one-concurrent
-- limit, and token accounting per generation.
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceFileId" TEXT,
    "status" "GenerationStatus" NOT NULL DEFAULT 'QUEUED',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "errorReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GenerationJob_userId_createdAt_idx" ON "GenerationJob"("userId", "createdAt");
CREATE INDEX "GenerationJob_userId_status_idx" ON "GenerationJob"("userId", "status");
CREATE INDEX "GenerationJob_sourceFileId_idx" ON "GenerationJob"("sourceFileId");
CREATE INDEX "GenerationJob_status_idx" ON "GenerationJob"("status");

ALTER TABLE "GenerationJob"
  ADD CONSTRAINT "GenerationJob_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GenerationJob"
  ADD CONSTRAINT "GenerationJob_sourceFileId_fkey"
  FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
