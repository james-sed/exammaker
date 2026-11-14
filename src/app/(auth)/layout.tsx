import React from "react";
import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-primary text-white shadow-md group-hover:scale-105 transition-transform">
              <CheckSquare className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {APP_NAME}
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            The intelligent platform for building and taking exams
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
