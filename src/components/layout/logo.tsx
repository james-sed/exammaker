import Link from "next/link";
import { Check } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  href?: string;
}

/** Wordmark plus a check mark tile. Reused by nav, footer, auth, and sidebar. */
export function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={`${APP_NAME} — home`}
      className={cn(
        "focus-ring inline-flex h-11 items-center gap-2.5 rounded-md",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <Check className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="font-display text-lg font-bold tracking-[-0.02em] text-foreground">
        {APP_NAME}
      </span>
    </Link>
  );
}
