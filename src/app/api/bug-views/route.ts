import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { savedViewSchema } from "@/lib/validators/bug";
import { createSavedView, listSavedViews } from "@/features/bugs/saved-view-service";

export async function GET() { try { return apiSuccess(await listSavedViews(await requireActiveUser()), "Đã tải chế độ xem"); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { assertSameOriginRequest(request); const actor = await requireActiveUser(); const parsed = savedViewSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Dữ liệu chế độ xem không hợp lệ", 400); await enforceUserMutationLimit("bug-view:create", actor.id, 20); return apiSuccess(await createSavedView(actor, parsed.data), "Đã lưu chế độ xem", 201); } catch (error) { return apiError(error); } }
