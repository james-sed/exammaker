"use client";

import React, { useState } from "react";
import { Copy, Check, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizTitle: string;
  shareCode: string;
}

export function ShareLinkModal({
  isOpen,
  onClose,
  quizTitle,
  shareCode,
}: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/quiz/${shareCode}/take`
    : `/quiz/${shareCode}/take`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Share2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Share Quiz</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <p className="text-sm text-slate-600">
            Share this link with students to allow them to take{" "}
            <span className="font-semibold text-slate-900">&quot;{quizTitle}&quot;</span>:
          </p>

          <div className="flex gap-2">
            <Input
              readOnly
              value={shareUrl}
              className="bg-slate-50 font-mono text-xs select-all"
            />
            <Button onClick={handleCopy} className="shrink-0 flex items-center gap-1.5">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Note: Students must be signed in to submit their attempts.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
