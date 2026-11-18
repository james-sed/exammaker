-- Step 4: owner-scoped source files for private Blob uploads.
--
-- A source file is created when the upload token is issued, before any quiz
-- exists. Existing rows are backfilled from the quiz owner before ownerId
-- becomes required.

ALTER TABLE "SourceFile" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "SourceFile" ADD COLUMN "blobDeleteFailedAt" TIMESTAMP(3);
ALTER TABLE "SourceFile" ADD COLUMN "pages" JSONB;

-- Backfill ownerId from the quiz that owned each existing source file.
UPDATE "SourceFile" AS sf
SET "ownerId" = q."ownerId"
FROM "Quiz" AS q
WHERE sf."quizId" = q."id" AND sf."ownerId" IS NULL;

ALTER TABLE "SourceFile" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "SourceFile" ALTER COLUMN "quizId" DROP NOT NULL;

CREATE UNIQUE INDEX "SourceFile_blobKey_key" ON "SourceFile"("blobKey");
CREATE INDEX "SourceFile_ownerId_idx" ON "SourceFile"("ownerId");
CREATE INDEX "SourceFile_ownerId_createdAt_idx" ON "SourceFile"("ownerId", "createdAt");
CREATE INDEX "SourceFile_status_updatedAt_idx" ON "SourceFile"("status", "updatedAt");

ALTER TABLE "SourceFile"
  ADD CONSTRAINT "SourceFile_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
