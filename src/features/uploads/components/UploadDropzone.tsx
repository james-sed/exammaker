"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { upload } from "@vercel/blob/client";
import { AlertCircle, FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_EXTENSIONS_LABEL,
  ACCEPT_ATTRIBUTE,
  MAX_EXTRACTED_CHARACTERS,
  MAX_PAGES,
  MAX_UPLOAD_BYTES,
  expectedMimeTypeForName,
} from "../constants";
import { formatBytes, formatNumber } from "../format";
import type { SourceFileSummary } from "../types/upload.types";

interface UploadDropzoneProps {
  pathPrefix: string;
  onUploaded: (source: SourceFileSummary) => void;
}

type Phase = "idle" | "uploading" | "finishing";

function validateFile(file: File): string | null {
  if (!expectedMimeTypeForName(file.name)) {
    return `Only ${ACCEPTED_EXTENSIONS_LABEL} files are supported.`;
  }

  if (file.size === 0) {
    return "That file is empty. Choose a file that contains text.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(
      MAX_UPLOAD_BYTES
    )}.`;
  }

  return null;
}

export function UploadDropzone({
  pathPrefix,
  onUploaded,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = phase !== "idle";

  const startUpload = async (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    const mimeType = expectedMimeTypeForName(file.name);

    if (!mimeType) {
      setError(`Only ${ACCEPTED_EXTENSIONS_LABEL} files are supported.`);
      return;
    }

    setError(null);
    setFileName(file.name);
    setProgress(0);
    setPhase("uploading");

    // Normalize the declared type so browsers that report an empty type for
    // Office files or TXT still satisfy the token's content-type allowlist.
    const normalized = new File([file], file.name, {
      type: mimeType,
      lastModified: file.lastModified,
    });

    const pathname = `${pathPrefix}${crypto.randomUUID()}`;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await upload(pathname, normalized, {
        access: "private",
        handleUploadUrl: "/api/uploads/token",
        clientPayload: JSON.stringify({
          name: file.name,
          type: mimeType,
          size: file.size,
        }),
        abortSignal: controller.signal,
        onUploadProgress: ({ percentage }) => {
          setProgress(Math.round(percentage));
        },
      });

      setPhase("finishing");

      const response = await fetch("/api/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: unknown;
        } | null;
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "We couldn't finish reading that file. Try again."
        );
      }

      const data = (await response.json()) as {
        sourceFile: SourceFileSummary;
      };

      setProgress(100);
      onUploaded(data.sourceFile);
    } catch (uploadError) {
      if (controller.signal.aborted) {
        setError("Upload canceled.");
      } else if (
        uploadError instanceof Error &&
        uploadError.message.includes("client token")
      ) {
        setError(
          "We couldn't start the upload. Uploads may not be configured yet — try again in a moment."
        );
      } else {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "The upload failed. Try again."
        );
      }
    } finally {
      abortRef.current = null;
      setPhase("idle");
      setFileName(null);
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    if (busy) return;

    const file = event.dataTransfer.files?.[0];
    if (file) void startUpload(file);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary-tint"
            : "border-border bg-card",
          busy ? "opacity-80" : "",
        ].join(" ")}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary-tint-foreground">
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : (
            <FileUp className="h-6 w-6" aria-hidden="true" />
          )}
        </div>

        <p className="font-display text-base font-semibold text-foreground">
          {phase === "finishing"
            ? "Reading your file"
            : busy
              ? "Uploading"
              : "Drop a file here"}
        </p>

        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {ACCEPTED_EXTENSIONS_LABEL} · up to {formatBytes(MAX_UPLOAD_BYTES)} ·{" "}
          {MAX_PAGES} pages · {formatNumber(MAX_EXTRACTED_CHARACTERS)}{" "}
          characters
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void startUpload(file);
          }}
          disabled={busy}
        />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            Choose file
          </Button>

          {busy ? (
            <Button type="button" variant="ghost" onClick={cancel}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          ) : null}
        </div>

        {fileName ? (
          <p className="mt-4 max-w-full truncate text-xs text-subtle-foreground">
            {fileName}
          </p>
        ) : null}

        {busy ? (
          <div className="mt-4 w-full max-w-sm">
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {phase === "finishing"
                ? "Extracting text and deleting the original upload…"
                : `${progress}%`}
            </p>
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive-fill/20 bg-destructive-tint px-4 py-3 text-sm text-destructive-tint-foreground"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
