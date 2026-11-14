"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    );
  }

  const { name, email, role } = session.user;
  const isTeacher = role === "TEACHER" || role === "ADMIN";

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col text-right hidden sm:flex">
        <span className="text-sm font-semibold leading-none text-slate-900">
          {name || "User"}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">{email}</span>
      </div>

      <Badge variant={isTeacher ? "default" : "secondary"}>
        {role}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut({ callbackUrl: "/login" })}
        title="Sign Out"
        className="text-slate-500 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
