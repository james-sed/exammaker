import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Status labels. Semantic variants are reserved for their meaning:
 * success = correct, warning = time/warning, destructive = incorrect/error.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium leading-4",
  {
    variants: {
      variant: {
        neutral:
          "border-transparent bg-secondary text-secondary-foreground",
        primary: "border-primary/15 bg-primary-tint text-primary-tint-foreground",
        success:
          "border-success-fill/20 bg-success-tint text-success-tint-foreground",
        warning:
          "border-warning-accent/30 bg-warning-tint text-warning-tint-foreground",
        destructive:
          "border-destructive-fill/20 bg-destructive-tint text-destructive-tint-foreground",
        outline: "border-border bg-card text-muted-foreground",
        /** @deprecated Use `primary`. */
        default: "border-primary/15 bg-primary-tint text-primary-tint-foreground",
        /** @deprecated Use `neutral`. */
        secondary: "border-transparent bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
