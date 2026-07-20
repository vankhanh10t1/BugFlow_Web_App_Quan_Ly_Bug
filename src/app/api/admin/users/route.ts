import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSystemRole } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { createAdminUserSchema, adminUserQuerySchema } from "@/lib/validators/admin-user";
import { createUserByAdmin, listUsers } from "@/features/users/admin-service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";

export async function GET(request: Request) {
  try {
    const actor = await requireSystemRole(["ADMIN"]);
    const query = adminUserQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) throw new AppError("VALIDATION_ERROR", "Bộ lọc người dùng không hợp lệ", 400);
    return apiSuccess(await listUsers(actor, query.data), "Đã tải danh sách người dùng");
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireSystemRole(["ADMIN"]);
    const input = createAdminUserSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Dữ liệu người dùng không hợp lệ", 400);
    await enforceUserMutationLimit("admin:mutation", actor.id, 30);
    return apiSuccess(await createUserByAdmin(actor, input.data), "Đã tạo tài khoản", 201);
  } catch (error) { return apiError(error); }
}
