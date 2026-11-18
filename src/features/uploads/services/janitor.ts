import { Prisma } from "@prisma/client";
import { del, list } from "@vercel/blob";
import { db } from "@/lib/db";
import {
  ACTIVE_HEARTBEAT_MS,
  BLOB_PREFIX,
  RUNNING_SOURCE_STATUSES,
  UNATTACHED_SOURCE_RETENTION_MS,
} from "../constants";

const STALE_MESSAGE =
  "The upload was interrupted before it finished. Please upload the file again.";

const MAX_ROWS_PER_CATEGORY = 500;
const MAX_LIST_PAGES = 50;
const DELETE_BATCH_SIZE = 100;

export interface JanitorResult {
  staleSourcesFailed: number;
  orphanBlobsDeleted: number;
  blobDeletesRetried: number;
  unattachedSourcesDeleted: number;
  errors: string[];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Reconciles SourceFile rows with the private Blob store. Cron frequency is a
 * convenience, not a correctness guarantee: every step re-checks the row's
 * status and 10-minute heartbeat before acting.
 */
export async function runJanitor(now = new Date()): Promise<JanitorResult> {
  const result: JanitorResult = {
    staleSourcesFailed: 0,
    orphanBlobsDeleted: 0,
    blobDeletesRetried: 0,
    unattachedSourcesDeleted: 0,
    errors: [],
  };

  const staleBefore = new Date(now.getTime() - ACTIVE_HEARTBEAT_MS);
  const retentionBefore = new Date(
    now.getTime() - UNATTACHED_SOURCE_RETENTION_MS
  );

  // 1. Finish any delete that failed earlier, plus any finished row that still
  //    points at a blob (for example, a crash between READY and delete).
  const pendingDeletes = await db.sourceFile.findMany({
    where: {
      blobKey: { not: null },
      OR: [
        { blobDeleteFailedAt: { not: null } },
        { status: { in: ["READY", "FAILED"] } },
      ],
    },
    select: { id: true, blobKey: true },
    take: MAX_ROWS_PER_CATEGORY,
  });

  for (const source of pendingDeletes) {
    if (!source.blobKey) continue;

    try {
      await del(source.blobKey);
      await db.sourceFile.update({
        where: { id: source.id },
        data: { blobKey: null, blobDeleteFailedAt: null },
      });
      result.blobDeletesRetried += 1;
    } catch (error) {
      result.errors.push(
        `delete ${source.id}: ${errorMessage(error)}`
      );
      await db.sourceFile
        .update({
          where: { id: source.id },
          data: { blobDeleteFailedAt: now },
        })
        .catch(() => undefined);
    }
  }

  // 2. Fail rows that have been running longer than the active heartbeat.
  const staleSources = await db.sourceFile.findMany({
    where: {
      status: { in: RUNNING_SOURCE_STATUSES },
      updatedAt: { lt: staleBefore },
    },
    select: { id: true, blobKey: true },
    take: MAX_ROWS_PER_CATEGORY,
  });

  for (const source of staleSources) {
    try {
      await db.sourceFile.update({
        where: { id: source.id },
        data: {
          status: "FAILED",
          errorReason: STALE_MESSAGE,
          extractedText: null,
          pages: Prisma.DbNull,
          pageCount: null,
          charCount: null,
        },
      });
      result.staleSourcesFailed += 1;
    } catch (error) {
      result.errors.push(`stale ${source.id}: ${errorMessage(error)}`);
      continue;
    }

    if (!source.blobKey) continue;

    try {
      await del(source.blobKey);
      await db.sourceFile.update({
        where: { id: source.id },
        data: { blobKey: null, blobDeleteFailedAt: null },
      });
    } catch (error) {
      result.errors.push(
        `stale delete ${source.id}: ${errorMessage(error)}`
      );
      await db.sourceFile
        .update({
          where: { id: source.id },
          data: { blobDeleteFailedAt: now },
        })
        .catch(() => undefined);
    }
  }

  // 3. Remove sources that never became part of a quiz, including their text.
  const unattachedSources = await db.sourceFile.findMany({
    where: {
      quizId: null,
      createdAt: { lt: retentionBefore },
    },
    select: { id: true, blobKey: true },
    take: MAX_ROWS_PER_CATEGORY,
  });

  for (const source of unattachedSources) {
    if (source.blobKey) {
      try {
        await del(source.blobKey);
      } catch {
        // The row is removed anyway; its blob is swept as an orphan below.
      }
    }

    try {
      await db.sourceFile.delete({ where: { id: source.id } });
      result.unattachedSourcesDeleted += 1;
    } catch (error) {
      result.errors.push(`unattached ${source.id}: ${errorMessage(error)}`);
    }
  }

  // 4. Delete blobs that no SourceFile row references.
  try {
    const tracked = await db.sourceFile.findMany({
      where: { blobKey: { not: null } },
      select: { blobKey: true },
    });

    const trackedKeys = new Set(
      tracked
        .map((source) => source.blobKey)
        .filter((key): key is string => Boolean(key))
    );

    const orphans: string[] = [];
    let cursor: string | undefined;
    let listPages = 0;

    do {
      const page = await list({
        prefix: BLOB_PREFIX,
        cursor,
        limit: 1000,
      });

      for (const blob of page.blobs) {
        if (!trackedKeys.has(blob.pathname)) {
          orphans.push(blob.pathname);
        }
      }

      cursor = page.hasMore ? page.cursor : undefined;
      listPages += 1;
    } while (cursor && listPages < MAX_LIST_PAGES);

    for (let index = 0; index < orphans.length; index += DELETE_BATCH_SIZE) {
      const batch = orphans.slice(index, index + DELETE_BATCH_SIZE);

      try {
        await del(batch);
        result.orphanBlobsDeleted += batch.length;
      } catch (error) {
        result.errors.push(`orphans: ${errorMessage(error)}`);
      }
    }
  } catch (error) {
    result.errors.push(`orphan scan: ${errorMessage(error)}`);
  }

  return result;
}
