import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const userRole = auth?.user?.role;

      const isAuthRoute =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");
      const isTeacherRoute = nextUrl.pathname.startsWith("/quizzes") || nextUrl.pathname.startsWith("/question-bank");
      const isStudentRoute = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/history");
      const isExamRoute = nextUrl.pathname.startsWith("/quiz/");

      if (isAuthRoute) {
        if (isLoggedIn) {
          const destination = userRole === "TEACHER" ? "/quizzes" : "/dashboard";
          return Response.redirect(new URL(destination, nextUrl));
        }
        return true;
      }

      if (isTeacherRoute) {
        if (!isLoggedIn) return false;
        return userRole === "TEACHER" || userRole === "ADMIN";
      }

      if (isStudentRoute || isExamRoute) {
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as "TEACHER" | "STUDENT" | "ADMIN";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "TEACHER" | "STUDENT" | "ADMIN";
      }
      return session;
    },
  },
  providers: [], // Configured with Credentials & OAuth in auth.ts (node runtime)
};
