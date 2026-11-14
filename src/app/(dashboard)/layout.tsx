import React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { UserNav } from "@/components/layout/UserNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Breadcrumb / contextual area */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
