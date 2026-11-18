"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SourceFileStatus } from "../constants";
import { formatBytes, formatNumber, formatRelativeTime } from "../format";
import type { SourceFileSummary } from "../types/upload.types";

interface SourceFileListProps {
  sources: SourceFileSummary[];
  selectedId: string | null;
  retryingId: string | null;
  onSelect: (id: string) => void;
  onRetry: (id: string) => void;
}

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive";

const STATUS_META: Record<
  SourceFileStatus,
  { label: string; variant: BadgeVariant; icon: typeof Clock3; spin?: boolean }
> = {
  UPLOADED: { label: "Uploading", variant: "warning", icon: Clock3 },
  EXTRACTING: {
    label: "Reading text",
    variant: "warning",
    icon: Loader2,
    spin: true,
  },
  GENERATING: { label: "Generating", variant: "primary", icon: Sparkles },
  READY: { label: "Text ready", variant: "success", icon: CheckCircle2 },
  FAILED: { label: "Failed", variant: "destructive", icon: AlertCircle },
};

export function SourceFileList({
  sources,
  selectedId,
  retryingId,
  onSelect,
  onRetry,
}: SourceFileListProps) {
  return (
    <ul className="space-y-3">
      {sources.map((source) => {
        const meta = STATUS_META[source.status];
        const StatusIcon = meta.icon;
        const selected = source.id === selectedId;
        const retrying = source.id === retryingId;

        return (
          <li key={source.id}>
            <div
              className={cn(
                "rounded-xl border bg-card p-4 transition-colors",
                selected
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(source.id)}
                aria-current={selected ? "true" : undefined}
                className="focus-ring flex w-full items-start gap-3 rounded-md text-left"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary-tint-foreground">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {source.originalName}
                  </span>

                  <span className="mt-1 block text-xs text-subtle-foreground">
                    {formatBytes(source.sizeBytes)} ·{" "}
                    {formatRelativeTime(source.createdAt)}
                  </span>

                  <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Badge variant={meta.variant}>
                      <StatusIcon
                        className={cn("h-3 w-3", meta.spin && "animate-spin")}
                        aria-hidden="true"
                      />
                      {meta.label}
                    </Badge>

                    {source.status === "READY" ? (
                      <span className="text-xs text-muted-foreground">
                        {source.pageCount ?? 0}{" "}
                        {source.pageCount === 1 ? "page" : "pages"} ·{" "}
                        {formatNumber(source.charCount ?? 0)} characters
                      </span>
                    ) : null}
                  </span>

                  {source.status === "FAILED" && source.errorReason ? (
                    <span className="mt-2 block text-sm text-destructive-text">
                      {source.errorReason}
                    </span>
                  ) : null}
                </span>
              </button>

              {source.canRetry ? (
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(source.id)}
                    disabled={retrying}
                  >
                    {retrying ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    )}
                    Try again
                  </Button>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
