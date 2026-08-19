import "server-only";
import type { ProjectRole, SystemRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { DocumentInput, DocumentQuery } from "@/lib/validators/document";

export type DocumentActor = { id: string; systemRole: SystemRole };
const person = { id: true, fullName: true, username: true, avatarUrl: true } as const;

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "tai-lieu";
}

async function access(projectId: string, actor: DocumentActor, mode: "read" | "write" | "manage" = "read") {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy dự án", 404);
  if (actor.systemRole === "ADMIN") return { role: undefined, canEdit: true, canManage: true };
  const membership = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: actor.id } }, select: { role: true } });
  if (!membership) throw new AppError("FORBIDDEN", "Bạn không có quyền truy cập tài liệu dự án", 403);
  const role: ProjectRole = membership.role;
  const canEdit = role !== "VIEWER";
  const canManage = role === "MANAGER";
  if (mode === "write" && !canEdit) throw new AppError("FORBIDDEN", "Bạn không có quyền chỉnh sửa tài liệu", 403);
  if (mode === "manage" && !canManage) throw new AppError("FORBIDDEN", "Chỉ quản lý dự án được thực hiện thao tác này", 403);
  return { role, canEdit, canManage };
}

async function uniqueSlug(projectId: string, title: string, excludeId?: string) {
  const base = slugify(title); let slug = base;
  for (let suffix = 2; await prisma.projectDocument.findFirst({ where: { projectId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } }); suffix++) slug = `${base}-${suffix}`;
  return slug;
}

export async function listDocuments(projectId: string, actor: DocumentActor, query: DocumentQuery) {
  const rights = await access(projectId, actor);
  const where = { projectId, deletedAt: null, ...(query.type ? { type: query.type } : {}), ...(query.search ? { OR: [
    { title: { contains: query.search, mode: "insensitive" as const } }, { content: { contains: query.search, mode: "insensitive" as const } }, { type: { contains: query.search, mode: "insensitive" as const } },
  ] } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.projectDocument.findMany({ where, select: { id: true, title: true, slug: true, type: true, updatedAt: true, createdAt: true, updatedBy: { select: person }, createdBy: { select: person }, _count: { select: { revisions: true } } }, orderBy: { updatedAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
    prisma.projectDocument.count({ where }),
  ]);
  return { items, permissions: { canEdit: rights.canEdit, canManage: rights.canManage }, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}

export async function createDocument(projectId: string, actor: DocumentActor, input: DocumentInput) {
  await access(projectId, actor, "write"); const slug = await uniqueSlug(projectId, input.title);
  return prisma.$transaction(async (tx) => {
    const document = await tx.projectDocument.create({ data: { projectId, ...input, slug, createdById: actor.id, updatedById: actor.id } });
    await tx.documentRevision.create({ data: { documentId: document.id, title: input.title, content: input.content, version: 1, createdById: actor.id } });
    await tx.activityLog.create({ data: { projectId, actorId: actor.id, actionType: "DOCUMENT_CREATED", description: `Đã tạo tài liệu “${input.title}”`, metadata: { documentId: document.id } } });
    return document;
  });
}

async function documentInProject(projectId: string, documentId: string, includeDeleted = false) {
  const doc = await prisma.projectDocument.findFirst({ where: { id: documentId, projectId, ...(includeDeleted ? {} : { deletedAt: null }) }, select: { id: true, projectId: true, title: true, slug: true, content: true, type: true, createdAt: true, updatedAt: true, deletedAt: true, createdBy: { select: person }, updatedBy: { select: person }, _count: { select: { revisions: true } } } });
  if (!doc) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy tài liệu", 404); return doc;
}

export async function getDocument(projectId: string, documentId: string, actor: DocumentActor) { const rights = await access(projectId, actor); return { ...(await documentInProject(projectId, documentId)), permissions: { canEdit: rights.canEdit, canManage: rights.canManage } }; }

export async function updateDocument(projectId: string, documentId: string, actor: DocumentActor, input: DocumentInput & { updatedAt: string }) {
  await access(projectId, actor, "write"); const current = await documentInProject(projectId, documentId);
  if (current.updatedAt.toISOString() !== input.updatedAt) throw new AppError("CONFLICT", "Tài liệu đã được người khác cập nhật. Hãy tải lại trước khi lưu.", 409);
  const slug = current.title === input.title ? current.slug : await uniqueSlug(projectId, input.title, documentId);
  return prisma.$transaction(async (tx) => {
    const latest = await tx.documentRevision.aggregate({ where: { documentId }, _max: { version: true } });
    const document = await tx.projectDocument.update({ where: { id: documentId }, data: { title: input.title, content: input.content, type: input.type, slug, updatedById: actor.id } });
    await tx.documentRevision.create({ data: { documentId, title: input.title, content: input.content, version: (latest._max.version ?? 0) + 1, createdById: actor.id } });
    await tx.activityLog.create({ data: { projectId, actorId: actor.id, actionType: "DOCUMENT_UPDATED", description: `Đã cập nhật tài liệu “${input.title}”`, metadata: { documentId } } }); return document;
  });
}

export async function deleteDocument(projectId: string, documentId: string, actor: DocumentActor) { await access(projectId, actor, "manage"); const doc = await documentInProject(projectId, documentId); await prisma.$transaction([prisma.projectDocument.update({ where: { id: documentId }, data: { deletedAt: new Date(), updatedById: actor.id } }), prisma.activityLog.create({ data: { projectId, actorId: actor.id, actionType: "DOCUMENT_DELETED", description: `Đã xóa tài liệu “${doc.title}”`, metadata: { documentId } } })]); }

export async function listRevisions(projectId: string, documentId: string, actor: DocumentActor) { await access(projectId, actor); await documentInProject(projectId, documentId); return prisma.documentRevision.findMany({ where: { documentId }, select: { id: true, version: true, title: true, createdAt: true, createdBy: { select: person } }, orderBy: { version: "desc" } }); }
export async function getRevision(projectId: string, documentId: string, revisionId: string, actor: DocumentActor) { await access(projectId, actor); await documentInProject(projectId, documentId); const revision = await prisma.documentRevision.findFirst({ where: { id: revisionId, documentId }, select: { id: true, title: true, content: true, version: true, createdAt: true, createdBy: { select: person } } }); if (!revision) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy phiên bản", 404); return revision; }
export async function restoreRevision(projectId: string, documentId: string, revisionId: string, actor: DocumentActor) { await access(projectId, actor, "manage"); const current = await documentInProject(projectId, documentId); const revision = await getRevision(projectId, documentId, revisionId, actor); const slug = current.title === revision.title ? current.slug : await uniqueSlug(projectId, revision.title, documentId); return prisma.$transaction(async (tx) => { const latest = await tx.documentRevision.aggregate({ where: { documentId }, _max: { version: true } }); const document = await tx.projectDocument.update({ where: { id: documentId }, data: { title: revision.title, content: revision.content, slug, updatedById: actor.id } }); await tx.documentRevision.create({ data: { documentId, title: revision.title, content: revision.content, version: (latest._max.version ?? 0) + 1, createdById: actor.id } }); await tx.activityLog.create({ data: { projectId, actorId: actor.id, actionType: "DOCUMENT_REVISION_RESTORED", description: `Đã khôi phục phiên bản ${revision.version} của “${revision.title}”`, metadata: { documentId, revisionId } } }); return document; }); }
