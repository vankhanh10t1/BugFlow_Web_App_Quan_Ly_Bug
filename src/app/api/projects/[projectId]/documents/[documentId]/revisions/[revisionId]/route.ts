import { apiError, apiSuccess } from "@/lib/api-response"; import { requireActiveUser } from "@/lib/auth"; import { getRevision } from "@/features/documents/service";
type Context = { params: Promise<{ projectId: string; documentId: string; revisionId: string }> };
export async function GET(_: Request, { params }: Context) { try { const p = await params; return apiSuccess(await getRevision(p.projectId, p.documentId, p.revisionId, await requireActiveUser()), "Đã tải phiên bản"); } catch (error) { return apiError(error); } }
