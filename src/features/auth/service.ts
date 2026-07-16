import "server-only";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { RegisterInput } from "@/lib/validators/auth";

export const safeUserSelect = {
  id: true,
  email: true,
  fullName: true,
  username: true,
  avatarUrl: true,
  systemRole: true,
  accountStatus: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.accountStatus !== "ACTIVE" || !(await compare(password, user.passwordHash))) return null;

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { id: user.id, email: user.email, name: user.fullName, image: user.avatarUrl, systemRole: user.systemRole };
}

export async function registerUser(input: RegisterInput) {
  const { password, ...userData } = input;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
    select: { email: true, username: true },
  });
  if (existing) throw new AppError("DUPLICATE_RESOURCE", existing.email === input.email ? "Email is already registered" : "Username is already taken", 409);

  try {
    return await prisma.user.create({
      data: { ...userData, passwordHash: await hash(password, 12) },
      select: safeUserSelect,
    });
  } catch {
    throw new AppError("DUPLICATE_RESOURCE", "Email or username is already registered", 409);
  }
}
