import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    authorized({ auth, request }) {
      const isAuthenticated = Boolean(auth?.user?.twoFactorVerified);
      const pathname = request.nextUrl.pathname;
      const isAuthPage = pathname.startsWith("/login") || pathname === "/register";
      const isPublicPage = pathname === "/" || pathname === "/docs";

      if (isAuthPage && isAuthenticated) return Response.redirect(new URL("/dashboard", request.nextUrl));
      return isPublicPage || isAuthPage || isAuthenticated;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
