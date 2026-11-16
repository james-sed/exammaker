"use client";

import React, { useState } from "react";
import { Copy, Check, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizTitle: string;
  shareId: string;
}

export function ShareLinkModal({
  isOpen,
  onClose,
  quizTitle,
  shareId,
}: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/q/${shareId}`
      : `/q/${shareId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-md animate-in rounded-xl border border-border bg-card p-6 shadow-2xl fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary-tint p-1.5 text-primary-tint-foreground">
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 id="share-title" className="text-lg font-bold text-foreground">
              Share quiz
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="focus-ring rounded-md p-1 text-subtle-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 py-4">
          <p className="text-sm text-muted-foreground">
            Anyone with this link can take{" "}
            <span className="font-semibold text-foreground">
              &quot;{quizTitle}&quot;
            </span>
            . No account needed.
          </p>

          <div className="flex gap-2">
            <Input
              readOnly
              value={shareUrl}
              aria-label="Share link"
              className="select-all bg-secondary font-mono text-xs"
            />
            <Button onClick={handleCopy} className="shrink-0">
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" /> Copy
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-3">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
