"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { registerUser } from "@/features/auth/service";
import { AppError } from "@/lib/errors";
import { loginSchema, registerSchema } from "@/lib/validators/auth";

export type AuthActionState = { success: false; message: string; fieldErrors?: Record<string, string[]> } | undefined;

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { success: false, message: "Invalid email or password, or the account is locked" };
    throw error;
  }
}

export async function registerAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { success: false, message: error.message };
    return { success: false, message: "Unable to create your account" };
  }

  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login");
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
