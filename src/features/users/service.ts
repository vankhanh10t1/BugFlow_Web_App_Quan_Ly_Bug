import "server-only";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { safeUserSelect } from "@/features/auth/service";
import type { ChangePasswordInput, UpdateProfileInput } from "@/lib/validators/auth";
import { deleteAsset, uploadAvatar } from "@/lib/cloudinary";
import { validateAvatar } from "@/lib/validators/avatar";

export async function getSafeUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: safeUserSelect });
}

export async function updateProfile(userId: string, input: UpdateProfileInput, avatar?: File) {
  const duplicate = await prisma.user.findFirst({ where: { username: input.username, NOT: { id: userId } }, select: { id: true } });
  if (duplicate) throw new AppError("DUPLICATE_RESOURCE", "Username is already taken", 409);
  const current = avatar ? await prisma.user.findUnique({ where: { id: userId }, select: { avatarPublicId: true } }) : null;
  if (avatar && !current) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy người dùng", 404);
  if (!avatar) return prisma.user.update({ where: { id: userId }, data: input, select: safeUserSelect });

  validateAvatar(avatar);
  const uploaded = await uploadAvatar(Buffer.from(await avatar.arrayBuffer()), avatar.name);
  try {
    const updated = await prisma.user.update({ where: { id: userId }, data: { ...input, avatarUrl: uploaded.secureUrl, avatarPublicId: uploaded.publicId }, select: safeUserSelect });
    if (current?.avatarPublicId) await deleteAsset(current.avatarPublicId, "image").catch(() => undefined);
    return updated;
  } catch (error) {
    await deleteAsset(uploaded.publicId, "image").catch(() => undefined);
    throw error;
  }
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new AppError("RESOURCE_NOT_FOUND", "User not found", 404);
  if (!(await compare(input.currentPassword, user.passwordHash))) throw new AppError("VALIDATION_ERROR", "Current password is incorrect", 400);
  if (await compare(input.newPassword, user.passwordHash)) throw new AppError("VALIDATION_ERROR", "New password must be different", 400);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hash(input.newPassword, 12) } });
}
