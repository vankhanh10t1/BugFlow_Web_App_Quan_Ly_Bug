import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { bugInputSchema, bugQuerySchema } from "@/lib/validators/bug";
import { createBug, listBugs } from "@/features/bugs/service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";

export async function GET(request: Request) { try { const actor = await requireActiveUser(); const parsed = bugQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams)); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid bug filters", 400); return apiSuccess(await listBugs(actor, parsed.data), "Bugs retrieved successfully"); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { const actor = await requireActiveUser(); const parsed = bugInputSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid bug data", 400); await enforceUserMutationLimit("bug:create", actor.id); return apiSuccess(await createBug(actor, parsed.data), "Bug created successfully", 201); } catch (error) { return apiError(error); } }
