import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { SystemRole } from "@/generated/prisma/client";
import { authConfig } from "@/auth.config";
import { verifyTwoFactorLogin } from "@/features/auth/two-factor-service";
import { twoFactorCredentialsSchema } from "@/lib/validators/two-factor";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" }, challengeToken: { label: "Challenge", type: "text" }, verification: { label: "Verification", type: "text" }, method: { label: "Method", type: "text" } },
      async authorize(credentials) {
        const twoFactor = twoFactorCredentialsSchema.safeParse(credentials);
        if (twoFactor.success) return verifyTwoFactorLogin(twoFactor.data.challengeToken, twoFactor.data.verification, twoFactor.data.method);
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.systemRole = user.systemRole as SystemRole;
        token.twoFactorVerified = true;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.systemRole = token.systemRole as SystemRole;
        session.user.twoFactorVerified = token.twoFactorVerified === true;
      }
      return session;
    },
  },
});
