import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { bugLinkSchema } from "@/lib/validators/bug";
import { createBugLink, listBugLinks } from "@/features/bugs/link-service";
type Context = { params: Promise<{ bugId: string }> };
export async function GET(_: Request, { params }: Context) { try { const actor = await requireActiveUser(); return apiSuccess(await listBugLinks((await params).bugId, actor), "Đã tải liên kết bug"); } catch (error) { return apiError(error); } }
export async function POST(request: Request, { params }: Context) { try { assertSameOriginRequest(request); const actor = await requireActiveUser(); const parsed = bugLinkSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Dữ liệu liên kết không hợp lệ", 400); await enforceUserMutationLimit("bug-link:create", actor.id, 20); return apiSuccess(await createBugLink((await params).bugId, actor, parsed.data), "Đã liên kết bug", 201); } catch (error) { return apiError(error); } }
