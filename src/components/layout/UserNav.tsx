"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Get started</Button>
        </Link>
      </div>
    );
  }

  const { name, email } = session.user;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden flex-col text-right sm:flex">
        <span className="text-sm font-semibold leading-none text-foreground">
          {name || "Account"}
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">{email}</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut({ callbackUrl: "/login" })}
        title="Sign out"
        aria-label="Sign out"
        className="text-muted-foreground hover:text-destructive-text"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
