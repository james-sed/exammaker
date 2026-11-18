import type { SourceFile } from "@prisma/client";
import type { SourceFileStatus } from "../constants";

/** One PDF page, PPTX slide, DOCX section, or TXT body, 1-indexed. */
export interface SourcePage {
  index: number;
  text: string;
}

/** A sentence-safe, model-sized slice of the extracted source. */
export interface TextChunk {
  index: number;
  text: string;
  pageStart: number;
  pageEnd: number;
  charCount: number;
}

export interface ExtractedDocument {
  kind: "pdf" | "docx" | "pptx" | "txt";
  pages: SourcePage[];
  pageCount: number;
}

/** Serializable source row for API responses and client components. */
export interface SourceFileSummary {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: SourceFileStatus;
  errorReason: string | null;
  pageCount: number | null;
  charCount: number | null;
  quizId: string | null;
  createdAt: string;
  updatedAt: string;
  /** A failed source whose blob still exists can be extracted again. */
  canRetry: boolean;
}

export interface SourceFileDetail extends SourceFileSummary {
  extractedText: string | null;
  pages: SourcePage[] | null;
  chunks: TextChunk[];
}

export interface FinalizeUploadResult {
  sourceFile: SourceFileSummary;
  /** True when another caller already claimed this extraction. */
  inProgress: boolean;
}

export type ExtractionOutcome =
  | { state: "ready"; sourceFile: SourceFileSummary }
  | { state: "failed"; sourceFile: SourceFileSummary }
  | { state: "in_progress"; sourceFile: SourceFileSummary };

export function toSourceFileSummary(
  source: Pick<
    SourceFile,
    | "id"
    | "originalName"
    | "mimeType"
    | "sizeBytes"
    | "status"
    | "errorReason"
    | "pageCount"
    | "charCount"
    | "quizId"
    | "createdAt"
    | "updatedAt"
    | "blobKey"
  >
): SourceFileSummary {
  return {
    id: source.id,
    originalName: source.originalName,
    mimeType: source.mimeType,
    sizeBytes: source.sizeBytes,
    status: source.status as SourceFileStatus,
    errorReason: source.errorReason,
    pageCount: source.pageCount,
    charCount: source.charCount,
    quizId: source.quizId,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
    canRetry: source.status === "FAILED" && Boolean(source.blobKey),
  };
}
