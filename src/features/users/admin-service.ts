import "server-only";
import { hash } from "bcryptjs";
import type { SystemRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { safeUserSelect } from "@/features/auth/service";
import type { AdminUserQuery, CreateAdminUserInput, UpdateAdminUserInput, UpdateAdminUserRoleInput, UpdateAdminUserStatusInput } from "@/lib/validators/admin-user";

export type AdminActor = { id: string; systemRole: SystemRole };

function assertAdmin(actor: AdminActor) {
  if (actor.systemRole !== "ADMIN") throw new AppError("FORBIDDEN", "Chỉ quản trị viên được thực hiện thao tác này", 403);
}

export async function listUsers(actor: AdminActor, query: AdminUserQuery) {
  assertAdmin(actor);
  const where = query.search ? { OR: [
    { fullName: { contains: query.search, mode: "insensitive" as const } },
    { email: { contains: query.search, mode: "insensitive" as const } },
    { username: { contains: query.search, mode: "insensitive" as const } },
  ] } : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: safeUserSelect, orderBy: { createdAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.user.count({ where }),
  ]);
  return { items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}

export const searchUsers = listUsers;

export async function createUserByAdmin(actor: AdminActor, input: CreateAdminUserInput) {
  assertAdmin(actor);
  const duplicate = await prisma.user.findFirst({ where: { OR: [{ email: input.email }, { username: input.username }] }, select: { email: true, username: true } });
  if (duplicate) throw new AppError("DUPLICATE_RESOURCE", duplicate.email === input.email ? "Email đã được sử dụng" : "Tên người dùng đã được sử dụng", 409);
  const { password, ...data } = input;
  try {
    return await prisma.user.create({ data: { ...data, passwordHash: await hash(password, 12), accountStatus: "ACTIVE" }, select: safeUserSelect });
  } catch {
    throw new AppError("DUPLICATE_RESOURCE", "Email hoặc tên người dùng đã được sử dụng", 409);
  }
}

export async function updateUserByAdmin(actor: AdminActor, userId: string, input: UpdateAdminUserInput) {
  assertAdmin(actor);
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy người dùng", 404);
  const duplicate = await prisma.user.findFirst({ where: { id: { not: userId }, OR: [{ email: input.email }, { username: input.username }] }, select: { email: true } });
  if (duplicate) throw new AppError("DUPLICATE_RESOURCE", duplicate.email === input.email ? "Email đã được sử dụng" : "Tên người dùng đã được sử dụng", 409);
  return prisma.user.update({ where: { id: userId }, data: input, select: safeUserSelect });
}

export async function changeAccountStatus(actor: AdminActor, userId: string, input: UpdateAdminUserStatusInput) {
  assertAdmin(actor);
  if (actor.id === userId && input.accountStatus !== "ACTIVE") throw new AppError("FORBIDDEN", "Bạn không thể tự khóa hoặc vô hiệu hóa tài khoản của mình", 403);
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy người dùng", 404);
  return prisma.user.update({ where: { id: userId }, data: { accountStatus: input.accountStatus }, select: safeUserSelect });
}

export const lockUser = (actor: AdminActor, userId: string) => changeAccountStatus(actor, userId, { accountStatus: "LOCKED" });
export const unlockUser = (actor: AdminActor, userId: string) => changeAccountStatus(actor, userId, { accountStatus: "ACTIVE" });
export const deactivateUser = (actor: AdminActor, userId: string) => changeAccountStatus(actor, userId, { accountStatus: "INACTIVE" });

export async function changeSystemRole(actor: AdminActor, userId: string, input: UpdateAdminUserRoleInput) {
  assertAdmin(actor);
  if (actor.id === userId && input.systemRole !== "ADMIN") throw new AppError("FORBIDDEN", "Bạn không thể tự hạ quyền quản trị của mình", 403);
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy người dùng", 404);
  return prisma.user.update({ where: { id: userId }, data: { systemRole: input.systemRole }, select: safeUserSelect });
}
