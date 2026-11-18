import { db } from "@/lib/db";
import { chunkPages } from "../services/chunkPages";
import { parseSourcePages } from "../services/sourcePageUtils";
import type {
  SourceFileDetail,
  SourceFileSummary,
} from "../types/upload.types";
import { toSourceFileSummary } from "../types/upload.types";

const SUMMARY_SELECT = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  status: true,
  errorReason: true,
  pageCount: true,
  charCount: true,
  quizId: true,
  blobKey: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listOwnedSourceFiles(
  ownerId: string,
  limit = 12
): Promise<SourceFileSummary[]> {
  const sources = await db.sourceFile.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: SUMMARY_SELECT,
  });

  return sources.map(toSourceFileSummary);
}

export async function getOwnedSourceFileSummary(
  sourceFileId: string,
  ownerId: string
): Promise<SourceFileSummary | null> {
  const source = await db.sourceFile.findFirst({
    where: { id: sourceFileId, ownerId },
    select: SUMMARY_SELECT,
  });

  return source ? toSourceFileSummary(source) : null;
}

export async function getOwnedSourceFileDetail(
  sourceFileId: string,
  ownerId: string
): Promise<SourceFileDetail | null> {
  const source = await db.sourceFile.findFirst({
    where: { id: sourceFileId, ownerId },
  });

  if (!source) return null;

  const pages =
    parseSourcePages(source.pages) ??
    (source.extractedText
      ? [{ index: 1, text: source.extractedText }]
      : null);

  return {
    ...toSourceFileSummary(source),
    extractedText: source.extractedText,
    pages,
    chunks: pages ? chunkPages(pages) : [],
  };
}
