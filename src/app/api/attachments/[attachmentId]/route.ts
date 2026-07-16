import { requireActiveUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { removeAttachment } from "@/features/attachments/service";
export async function DELETE(_: Request, { params }: { params: Promise<{ attachmentId: string }> }) { try { const { attachmentId } = await params; await removeAttachment(attachmentId, await requireActiveUser()); return apiSuccess(null, "Attachment deleted"); } catch (error) { return apiError(error); } }
