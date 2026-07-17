import type { DefaultSession } from "next-auth";
import type { SystemRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User { systemRole: SystemRole; twoFactorVerified?: boolean }
  interface Session {
    user: { id: string; systemRole: SystemRole; twoFactorVerified: boolean } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT { id: string; systemRole: SystemRole; twoFactorVerified?: boolean }
}
