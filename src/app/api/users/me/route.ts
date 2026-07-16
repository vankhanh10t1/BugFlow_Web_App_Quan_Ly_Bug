import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";

export async function GET() {
  try {
    return apiSuccess(await requireActiveUser(), "Current user retrieved");
  } catch (error) {
    return apiError(error);
  }
}
