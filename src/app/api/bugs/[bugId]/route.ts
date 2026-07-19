import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { bugUpdateSchema } from "@/lib/validators/bug";
import { getBug, updateBug } from "@/features/bugs/service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
type Context = { params: Promise<{ bugId: string }> };
export async function GET(_: Request, { params }: Context) { try { return apiSuccess(await getBug((await params).bugId, await requireActiveUser()), "Bug retrieved successfully"); } catch (error) { return apiError(error); } }
export async function PATCH(request: Request, { params }: Context) { try { const actor = await requireActiveUser(); const parsed = bugUpdateSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid bug data", 400); await enforceUserMutationLimit("bug:update", actor.id, 30); return apiSuccess(await updateBug((await params).bugId, actor, parsed.data), "Bug updated successfully"); } catch (error) { return apiError(error); } }
