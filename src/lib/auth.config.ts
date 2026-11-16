import type { NextAuthConfig } from "next-auth";

function isOwnerRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/quizzes") ||
    pathname.startsWith("/settings")
  );
}

function isAuthRoute(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/register");
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = nextUrl;

      if (isAuthRoute(pathname)) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Owner routes require a session. Everything else, including
      // /q/[shareId] and the marketing pages, stays public.
      if (isOwnerRoute(pathname)) {
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
      }
      return session;
    },
  },
  providers: [], // Configured with Credentials & Google in auth.ts (node runtime)
};
