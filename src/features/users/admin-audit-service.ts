import "server-only";
import { prisma } from "@/lib/prisma";

const allowedKeys = new Set(["id", "email", "fullName", "username", "systemRole", "accountStatus", "twoFactorEnabled", "twoFactorEnabledAt"]);
function safe(value: unknown) { if (!value || typeof value !== "object") return undefined; return Object.fromEntries(Object.entries(value).filter(([key]) => allowedKeys.has(key))); }
export function auditRequestContext(request: Request) { const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(); return { ipAddress: forwarded || request.headers.get("x-real-ip") || null, userAgent: request.headers.get("user-agent")?.slice(0, 500) || null }; }
export async function recordAdminAudit(input: { adminUserId: string; targetUserId?: string | null; action: string; beforeValue?: unknown; afterValue?: unknown; reason?: string | null; ipAddress?: string | null; userAgent?: string | null }) {
  await prisma.adminAuditLog.create({ data: { adminUserId: input.adminUserId, targetUserId: input.targetUserId, action: input.action, beforeValue: safe(input.beforeValue), afterValue: safe(input.afterValue), reason: input.reason?.trim().slice(0, 500) || null, ipAddress: input.ipAddress, userAgent: input.userAgent } });
}
export async function getAdminAuditSnapshot(userId: string) { return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, fullName: true, username: true, systemRole: true, accountStatus: true, twoFactorEnabled: true, twoFactorEnabledAt: true } }); }
