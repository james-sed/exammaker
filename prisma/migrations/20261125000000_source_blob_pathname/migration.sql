-- Step 4 follow-up: keep the upload pathname forever so a repeated finalize
-- still finds its source after extraction cleared blobKey.
--
-- blobKey remains the "binary may still exist" marker used by extraction and
-- the janitor.

ALTER TABLE "SourceFile" ADD COLUMN "blobPathname" TEXT;

-- Rows whose binary has not been deleted yet still carry the pathname.
UPDATE "SourceFile"
SET "blobPathname" = "blobKey"
WHERE "blobKey" IS NOT NULL AND "blobPathname" IS NULL;

CREATE UNIQUE INDEX "SourceFile_blobPathname_key" ON "SourceFile"("blobPathname");
