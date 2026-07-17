import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSystemRole } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { updateAdminUserRoleSchema } from "@/lib/validators/admin-user";
import { changeSystemRole } from "@/features/users/admin-service";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const actor = await requireSystemRole(["ADMIN"]);
    const input = updateAdminUserRoleSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", "Vai trò hệ thống không hợp lệ", 400);
    return apiSuccess(await changeSystemRole(actor, (await params).id, input.data), "Đã cập nhật vai trò hệ thống");
  } catch (error) { return apiError(error); }
}
