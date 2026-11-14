"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckSquare,
  BookOpen,
  FolderKanban,
  LayoutDashboard,
  History,
  Settings,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isTeacher = session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN";

  const teacherNavItems = [
    { name: "My Quizzes", href: "/quizzes", icon: BookOpen },
    { name: "Question Bank", href: "/question-bank", icon: FolderKanban },
  ];

  const studentNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Attempt History", href: "/history", icon: History },
  ];

  const currentNavItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary text-white shadow-sm">
            <CheckSquare className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">
            {APP_NAME}
          </span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {isTeacher ? "Teacher Portal" : "Student Portal"}
          </p>
          <nav className="space-y-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Preferences
          </p>
          <nav className="space-y-1">
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === "/settings"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}
