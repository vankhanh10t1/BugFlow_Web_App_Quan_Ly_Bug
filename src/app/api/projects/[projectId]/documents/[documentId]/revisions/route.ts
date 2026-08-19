import { apiError, apiSuccess } from "@/lib/api-response"; import { requireActiveUser } from "@/lib/auth"; import { listRevisions } from "@/features/documents/service";
type Context = { params: Promise<{ projectId: string; documentId: string }> };
export async function GET(_: Request, { params }: Context) { try { const p = await params; return apiSuccess(await listRevisions(p.projectId, p.documentId, await requireActiveUser()), "Đã tải lịch sử phiên bản"); } catch (error) { return apiError(error); } }
