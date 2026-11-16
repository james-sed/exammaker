import React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { UserNav } from "@/components/layout/UserNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4" />
          <UserNav />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
