"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileText, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";
import { formatNumber } from "../format";
import { readApiError } from "../http";
import type { SourceFileDetail } from "../types/upload.types";

interface SourcePreviewProps {
  sourceId: string | null;
}

/**
 * Read-only preview of the sanitized text that was saved after extraction.
 * The full text is collapsed by default so long uploads do not flood the page.
 */
export function SourcePreview({ sourceId }: SourcePreviewProps) {
  const [detail, setDetail] = useState<SourceFileDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceId) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDetail(null);

    fetch(`/api/uploads/${sourceId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            await readApiError(
              response,
              "We couldn't load the extracted text for this file."
            )
          );
        }

        const data = (await response.json()) as { source: SourceFileDetail };
        return data.source;
      })
      .then((source) => {
        if (!controller.signal.aborted) setDetail(source);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "We couldn't load the extracted text for this file."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [sourceId]);

  if (!sourceId) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            Text preview
          </CardTitle>
          <CardDescription>
            Select an upload to review the text that was extracted from it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Nothing selected yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex min-h-[240px] items-center justify-center">
          <LoadingSpinner label="Loading extracted text" />
        </CardContent>
      </Card>
    );
  }

  if (error || !detail) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive-fill/20 bg-destructive-tint px-4 py-3 text-sm text-destructive-tint-foreground"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <p>{error ?? "We couldn't load the extracted text for this file."}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (detail.status !== "READY" || !detail.extractedText) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">{detail.originalName}</CardTitle>
          <CardDescription>
            Text preview is available once extraction succeeds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detail.status === "FAILED" && detail.errorReason ? (
            <p className="text-sm text-destructive-text">{detail.errorReason}</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingSpinner size="sm" label="Extraction in progress" />
              Extracting text…
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="min-w-0 break-all text-base">
            {detail.originalName}
          </CardTitle>
          <Badge variant="success">Text ready</Badge>
        </div>
        <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            {formatNumber(detail.pageCount ?? 0)}{" "}
            {detail.pageCount === 1 ? "page" : "pages"}
          </span>
          <span>{formatNumber(detail.charCount ?? 0)} characters</span>
          <span>
            {formatNumber(detail.chunks.length)}{" "}
            {detail.chunks.length === 1 ? "chunk" : "chunks"}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {detail.chunks.length > 0 ? (
          <ol className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {detail.chunks.map((chunk) => (
              <li
                key={chunk.index}
                className="rounded-lg border border-border bg-muted/40 px-3 py-2"
              >
                <p className="text-xs font-medium text-subtle-foreground">
                  Chunk {chunk.index + 1} · pages {chunk.pageStart}
                  {chunk.pageEnd !== chunk.pageStart
                    ? `–${chunk.pageEnd}`
                    : ""}{" "}
                  · {formatNumber(chunk.charCount)} characters
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-foreground">
                  {chunk.text}
                </p>
              </li>
            ))}
          </ol>
        ) : null}

        <details className="rounded-lg border border-border">
          <summary className="focus-ring cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-foreground">
            Show full extracted text
          </summary>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words border-t border-border px-3 py-3 text-xs leading-relaxed text-muted-foreground">
            {detail.extractedText}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
