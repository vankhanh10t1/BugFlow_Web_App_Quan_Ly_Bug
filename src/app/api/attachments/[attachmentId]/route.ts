import { requireActiveUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { removeAttachment } from "@/features/attachments/service";
import { assertSameOriginRequest } from "@/lib/request-security";
export async function DELETE(request: Request, { params }: { params: Promise<{ attachmentId: string }> }) { try { assertSameOriginRequest(request); const { attachmentId } = await params; await removeAttachment(attachmentId, await requireActiveUser()); return apiSuccess(null, "Attachment deleted"); } catch (error) { return apiError(error); } }
