import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSystemRole } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { updateAdminUserSchema } from "@/lib/validators/admin-user";
import { deactivateUser, updateUserByAdmin } from "@/features/users/admin-service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireSystemRole(["ADMIN"]);
    const input = updateAdminUserSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Dữ liệu người dùng không hợp lệ", 400);
    await enforceUserMutationLimit("admin:mutation", actor.id, 30);
    return apiSuccess(await updateUserByAdmin(actor, (await params).id, input.data), "Đã cập nhật người dùng");
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireSystemRole(["ADMIN"]);
    await enforceUserMutationLimit("admin:mutation", actor.id, 30);
    return apiSuccess(await deactivateUser(actor, (await params).id), "Đã vô hiệu hóa tài khoản");
  } catch (error) { return apiError(error); }
}
