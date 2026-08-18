import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { getMute, setMute } from "@/features/notifications/service";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type TargetType = "PROJECT" | "CONVERSATION";
function parse(request: Request) {
  const url = new URL(request.url); const targetType = url.searchParams.get("targetType") as TargetType; const targetId = url.searchParams.get("targetId") ?? "";
  if (!(["PROJECT", "CONVERSATION"] as string[]).includes(targetType) || !targetId) throw new AppError("VALIDATION_ERROR", "Đối tượng mute không hợp lệ", 400);
  return { targetType, targetId };
}
async function assertAccess(userId: string, systemRole: string, targetType: TargetType, targetId: string) {
  if (targetType === "PROJECT") {
    const found = await prisma.project.findFirst({ where: { id: targetId, ...(systemRole === "ADMIN" ? {} : { members: { some: { userId } } }) }, select: { id: true } });
    if (!found) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy dự án", 404);
  } else {
    const found = await prisma.chatConversation.findFirst({ where: { id: targetId, OR: [{ participants: { some: { userId, leftAt: null } } }, { project: { members: { some: { userId } } } }] }, select: { id: true } });
    if (!found) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy hội thoại", 404);
  }
}
export async function GET(request: Request) { try { const user = await requireActiveUser(); const target = parse(request); await assertAccess(user.id, user.systemRole, target.targetType, target.targetId); return apiSuccess({ muted: await getMute(user.id, target.targetType, target.targetId) }, "Đã tải trạng thái mute"); } catch (error) { return apiError(error); } }
export async function PUT(request: Request) { try { assertSameOriginRequest(request); const user = await requireActiveUser(); await enforceUserMutationLimit("notification:mute", user.id, 30); const target = parse(request); await assertAccess(user.id, user.systemRole, target.targetType, target.targetId); const body: unknown = await request.json(); if (!body || typeof body !== "object" || typeof (body as { muted?: unknown }).muted !== "boolean") throw new AppError("VALIDATION_ERROR", "Trạng thái mute không hợp lệ", 400); return apiSuccess(await setMute(user.id, target.targetType, target.targetId, (body as { muted: boolean }).muted), "Đã cập nhật trạng thái mute"); } catch (error) { return apiError(error); } }
