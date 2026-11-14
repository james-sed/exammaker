"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "../types/auth.types";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGate({
  children,
  allowedRoles,
  fallback = null,
}: RoleGateProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-sm text-muted-foreground animate-pulse">Checking access...</div>;
  }

  const role = session?.user?.role as UserRole | undefined;

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
