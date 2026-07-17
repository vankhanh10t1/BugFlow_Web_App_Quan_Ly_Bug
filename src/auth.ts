import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { SystemRole } from "@/generated/prisma/client";
import { authConfig } from "@/auth.config";
import { authenticateUser } from "@/features/auth/service";
import { verifyTwoFactorLogin } from "@/features/auth/two-factor-service";
import { loginSchema } from "@/lib/validators/auth";
import { twoFactorCredentialsSchema } from "@/lib/validators/two-factor";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" }, challengeToken: { label: "Challenge", type: "text" }, verification: { label: "Verification", type: "text" }, method: { label: "Method", type: "text" } },
      async authorize(credentials) {
        const twoFactor = twoFactorCredentialsSchema.safeParse(credentials);
        if (twoFactor.success) return verifyTwoFactorLogin(twoFactor.data.challengeToken, twoFactor.data.verification, twoFactor.data.method);
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return authenticateUser(parsed.data.email, parsed.data.password);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.systemRole = user.systemRole as SystemRole;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.systemRole = token.systemRole as SystemRole;
      }
      return session;
    },
  },
});
