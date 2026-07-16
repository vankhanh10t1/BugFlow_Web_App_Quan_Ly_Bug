import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SystemRole } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { getSafeUserById } from "@/features/users/service";
import { AppError } from "@/lib/errors";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await getSafeUserById(session.user.id);
  return user?.accountStatus === "ACTIVE" ? user : null;
});

export async function requireActiveUser() {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  return user;
}

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSystemRole(roles: readonly SystemRole[]) {
  const user = await requireActiveUser();
  if (!roles.includes(user.systemRole)) throw new AppError("FORBIDDEN", "You do not have permission to perform this action", 403);
  return user;
}
