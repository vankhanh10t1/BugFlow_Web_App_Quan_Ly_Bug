import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { BugActor } from "@/features/bugs/service";
import type { z } from "zod";
import type { savedViewSchema, savedViewUpdateSchema } from "@/lib/validators/bug";

type SavedViewInput = z.infer<typeof savedViewSchema>;
type SavedViewUpdate = z.infer<typeof savedViewUpdateSchema>;
const select = { id: true, name: true, filters: true, isDefault: true, projectId: true, createdAt: true, updatedAt: true } as const;

export function listSavedViews(actor: BugActor) { return prisma.savedBugView.findMany({ where: { userId: actor.id }, select, orderBy: [{ isDefault: "desc" }, { name: "asc" }] }); }
export async function createSavedView(actor: BugActor, input: SavedViewInput) {
  if (input.isDefault) await prisma.savedBugView.updateMany({ where: { userId: actor.id, isDefault: true }, data: { isDefault: false } });
  return prisma.savedBugView.create({ data: { userId: actor.id, projectId: input.filters.projectId, name: input.name, filters: input.filters as Prisma.InputJsonValue, isDefault: input.isDefault }, select });
}
export async function updateSavedView(id: string, actor: BugActor, input: SavedViewUpdate) {
  const owned = await prisma.savedBugView.findFirst({ where: { id, userId: actor.id }, select: { id: true } });
  if (!owned) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy chế độ xem", 404);
  if (input.isDefault) await prisma.savedBugView.updateMany({ where: { userId: actor.id, isDefault: true, id: { not: id } }, data: { isDefault: false } });
  return prisma.savedBugView.update({ where: { id }, data: input, select });
}
export async function deleteSavedView(id: string, actor: BugActor) {
  const result = await prisma.savedBugView.deleteMany({ where: { id, userId: actor.id } });
  if (!result.count) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy chế độ xem", 404);
}
