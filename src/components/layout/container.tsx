import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

/** Single content column: 1152px max width with consistent gutters. */
export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    />
  );
}
