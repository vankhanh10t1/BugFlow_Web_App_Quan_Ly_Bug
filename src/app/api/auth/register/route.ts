import { apiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { registerSchema } from "@/lib/validators/auth";
import { registerUser } from "@/features/auth/service";

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid registration data", 400);
    return apiSuccess(await registerUser(parsed.data), "Account created successfully", 201);
  } catch (error) {
    return apiError(error);
  }
}
