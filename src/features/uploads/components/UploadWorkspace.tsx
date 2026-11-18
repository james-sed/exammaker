"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  PencilLine,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SourceFileList } from "./SourceFileList";
import { SourcePreview } from "./SourcePreview";
import { UploadDropzone } from "./UploadDropzone";
import { MAX_EXTRACTED_CHARACTERS, MAX_PAGES } from "../constants";
import { formatNumber } from "../format";
import { readApiError } from "../http";
import type { SourceFileSummary } from "../types/upload.types";

interface UploadWorkspaceProps {
  userId: string;
  initialSources: SourceFileSummary[];
}

const POLL_INTERVAL_MS = 5_000;

function isRunning(source: SourceFileSummary): boolean {
  return source.status === "UPLOADED" || source.status === "EXTRACTING";
}

/**
 * Upload and preview surface for /quizzes/new. Extraction happens inside the
 * finalize request, so a short poll only covers retries and stale reclaims.
 */
export function UploadWorkspace({
  userId,
  initialSources,
}: UploadWorkspaceProps) {
  const [sources, setSources] = useState(initialSources);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSources[0]?.id ?? null
  );
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasRunning = sources.some(isRunning);

  useEffect(() => {
    if (!hasRunning) return;

    const controller = new AbortController();
    const interval = setInterval(() => {
      fetch("/api/uploads?limit=12", { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as { sources: SourceFileSummary[] };
        })
        .then((data) => {
          if (data) setSources(data.sources);
        })
        .catch(() => {
          // Keep the current list; the next tick retries.
        });
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [hasRunning]);

  const selected = sources.find((source) => source.id === selectedId) ?? null;

  const handleUploaded = (source: SourceFileSummary) => {
    setSources((previous) => [
      source,
      ...previous.filter((item) => item.id !== source.id),
    ]);
    setSelectedId(source.id);
    setActionError(null);
  };

  const handleRetry = async (sourceFileId: string) => {
    setRetryingId(sourceFileId);
    setActionError(null);

    try {
      const response = await fetch("/api/uploads/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceFileId }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "We couldn't retry that extraction.")
        );
      }

      const data = (await response.json()) as {
        sourceFile: SourceFileSummary;
      };

      setSources((previous) =>
        previous.map((source) =>
          source.id === data.sourceFile.id ? data.sourceFile : source
        )
      );
      setSelectedId(data.sourceFile.id);
    } catch (retryError) {
      setActionError(
        retryError instanceof Error
          ? retryError.message
          : "We couldn't retry that extraction."
      );
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <Link href="/quizzes" aria-label="Back to quizzes">
            <Button variant="ghost" size="icon" aria-label="Back to quizzes">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Create a quiz
            </h1>
            <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
              Upload your notes, a past paper, or slides. We read the text and
              keep a preview — the original file is deleted as soon as reading
              finishes.
            </p>
          </div>
        </div>

        <Link href="/quizzes/new/manual">
          <Button variant="outline" className="gap-2">
            <PencilLine className="h-4 w-4" aria-hidden="true" />
            Build manually
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UploadCloud className="h-4 w-4 text-primary" aria-hidden="true" />
                Source material
              </CardTitle>
              <CardDescription>
                One file at a time. Up to {formatNumber(MAX_EXTRACTED_CHARACTERS)}{" "}
                characters of text from {MAX_PAGES} pages or fewer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UploadDropzone
                pathPrefix={`sources/${userId}/`}
                onUploaded={handleUploaded}
              />

              {actionError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive-fill/20 bg-destructive-tint px-4 py-3 text-sm text-destructive-tint-foreground"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <p>{actionError}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {selected?.status === "READY" ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg border border-success-fill/20 bg-success-tint px-4 py-3 text-sm text-success-tint-foreground"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                The text from this file is ready. Automatic question generation
                is the next step — for now you can start a quiz from your own
                questions.
              </p>
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your uploads</CardTitle>
              <CardDescription>
                Unattached uploads are removed after 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sources.length === 0 ? (
                <EmptyState
                  title="No uploads yet"
                  description="Upload a PDF, DOCX, PPTX, or TXT file to see it here."
                />
              ) : (
                <SourceFileList
                  sources={sources}
                  selectedId={selectedId}
                  retryingId={retryingId}
                  onSelect={setSelectedId}
                  onRetry={(id) => void handleRetry(id)}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <SourcePreview sourceId={selectedId} />
      </div>
    </div>
  );
}
