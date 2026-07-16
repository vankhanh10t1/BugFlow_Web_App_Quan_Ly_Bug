"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validators/auth";
import { changePassword, updateProfile } from "@/features/users/service";

export type ProfileActionState = { success: boolean; message: string; fieldErrors?: Record<string, string[]> } | undefined;

export async function updateProfileAction(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const user = await requireActiveUser();
  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await updateProfile(user.id, parsed.data);
    revalidatePath("/profile");
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    return { success: false, message: error instanceof AppError ? error.message : "Unable to update profile" };
  }
}

export async function changePasswordAction(_: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const user = await requireActiveUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await changePassword(user.id, parsed.data);
    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    return { success: false, message: error instanceof AppError ? error.message : "Unable to change password" };
  }
}
