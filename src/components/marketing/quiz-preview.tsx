import { Check, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type OptionState = "idle" | "selected" | "correct";

export type QuizPreviewVariant =
  | "hero"
  | "multiple-choice"
  | "true-false"
  | "short-answer";

export interface QuizPreviewProps {
  variant?: QuizPreviewVariant;
  className?: string;
}

function PreviewOption({
  label,
  text,
  state = "idle",
}: {
  label: string;
  text: string;
  state?: OptionState;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
        state === "selected" && "border-primary bg-primary-tint",
        state === "correct" &&
          "border-success-fill/40 bg-success-tint",
        state === "idle" && "border-border bg-background"
      )}
    >
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
          state === "selected" &&
            "border-primary bg-primary text-primary-foreground",
          state === "correct" &&
            "border-success-fill bg-success-fill text-success-foreground",
          state === "idle" && "border-border text-subtle-foreground"
        )}
      >
        {state === "correct" ? (
          <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
        ) : (
          label
        )}
      </span>
      <span
        className={cn(
          "text-sm",
          state === "idle"
            ? "text-muted-foreground"
            : "font-medium text-foreground"
        )}
      >
        {text}
      </span>
    </div>
  );
}

function HeroPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative", className)}
      role="img"
      aria-label="Preview of ExamMaker's quiz interface: a multiple-choice question with four answers, one selected, an amber countdown timer showing 04:32, a progress bar, and a green correct-answer confirmation worth two points."
    >
      {/* Layered card behind the live card for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-x-4 -top-3 bottom-3 rotate-[-2deg] rounded-2xl border border-border bg-card/60"
      />

      <div
        aria-hidden="true"
        className="relative rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Question 3 of 10
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-tint px-3 py-1 text-xs font-semibold tabular-nums text-warning">
            <Clock className="h-3.5 w-3.5 text-warning-accent" />
            04:32
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-subtle-foreground">
            <span>Progress</span>
            <span className="tabular-nums">30%</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[30%] rounded-full bg-primary" />
          </div>
        </div>

        <p className="mt-5 text-base font-medium leading-snug text-foreground">
          Which development most directly increased textile output in
          18th-century Britain?
        </p>

        <div className="mt-3 space-y-2">
          <PreviewOption label="A" text="The first steam locomotive" />
          <PreviewOption
            label="B"
            text="The mechanisation of spinning and weaving"
            state="selected"
          />
          <PreviewOption label="C" text="The Reform Act of 1832" />
          <PreviewOption label="D" text="The opening of the Stockton railway" />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-success-fill/25 bg-success-tint px-3 py-2.5 text-sm text-success-tint-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">Correct</span>
          <span className="ml-auto tabular-nums">2 / 2 points</span>
        </div>
      </div>
    </div>
  );
}

function PreviewFooter() {
  return (
    <div className="mt-auto pt-4">
      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-subtle-foreground">
        <span>Scored on submit</span>
        <span className="tabular-nums">1 point</span>
      </div>
    </div>
  );
}

function MultipleChoicePreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4",
        className
      )}
    >
      <p className="text-sm font-medium leading-snug text-foreground">
        Which organelle produces most of a cell&apos;s ATP?
      </p>
      <div className="mt-3 space-y-2">
        <PreviewOption label="A" text="Nucleus" />
        <PreviewOption label="B" text="Mitochondrion" state="correct" />
        <PreviewOption label="C" text="Ribosome" />
      </div>
      <PreviewFooter />
    </div>
  );
}

function TrueFalsePreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4",
        className
      )}
    >
      <p className="text-sm font-medium leading-snug text-foreground">
        Every fraction with a denominator of 10 has a terminating decimal.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-success-fill/40 bg-success-tint text-sm font-medium text-success-tint-foreground">
          <Check className="h-4 w-4" strokeWidth={3} />
          True
        </div>
        <div className="flex min-h-11 items-center justify-center rounded-lg border border-border bg-background text-sm text-muted-foreground">
          False
        </div>
      </div>
      <p className="mt-2 text-xs text-subtle-foreground">
        Answer key set to true. One point, no partial credit.
      </p>
      <PreviewFooter />
    </div>
  );
}

function ShortAnswerPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4",
        className
      )}
    >
      <p className="text-sm font-medium leading-snug text-foreground">
        Name the organelle responsible for aerobic respiration.
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2.5">
        <span className="text-sm text-foreground">Mitochondrion</span>
        <span className="h-4 w-px bg-primary" />
        <CheckCircle2 className="ml-auto h-4 w-4 text-success" />
      </div>
      <p className="mt-2 text-xs text-subtle-foreground">
        Accepted answers: mitochondrion, mitochondria
      </p>
      <PreviewFooter />
    </div>
  );
}

/**
 * Static product mock. Built from real markup (not an image) so it inherits
 * the design tokens and stays sharp at every density.
 */
export function QuizPreview({
  variant = "hero",
  className,
}: QuizPreviewProps) {
  switch (variant) {
    case "multiple-choice":
      return <MultipleChoicePreview className={className} />;
    case "true-false":
      return <TrueFalsePreview className={className} />;
    case "short-answer":
      return <ShortAnswerPreview className={className} />;
    default:
      return <HeroPreview className={className} />;
  }
}
