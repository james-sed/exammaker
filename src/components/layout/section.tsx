import * as React from "react";
import { cn } from "@/lib/utils";
import { Container } from "./container";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** `muted` adds a neutral band to separate adjacent sections. */
  tone?: "default" | "muted";
  containerClassName?: string;
}

/**
 * Vertical rhythm is owned here: 64px on mobile, 96px from `lg` up.
 * `scroll-mt-24` keeps anchored sections clear of the sticky nav.
 */
export function Section({
  className,
  containerClassName,
  tone = "default",
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "scroll-mt-20 py-16 lg:py-24",
        tone === "muted" && "border-y border-border bg-muted/40",
        className
      )}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-2xl text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-text">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="mt-4 text-balance text-3xl font-bold sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
