"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { statusTransitionSchema } from "@/lib/validators/workflow";
import { transitionBugStatus } from "@/features/bugs/workflow-service";

export type WorkflowActionState = { success: boolean; message: string } | undefined;
export async function transitionBugAction(bugId: string, _: WorkflowActionState, formData: FormData): Promise<WorkflowActionState> { const parsed = statusTransitionSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { success: false, message: "Invalid status" }; try { await transitionBugStatus(bugId, await requireActiveUser(), parsed.data.status); revalidatePath(`/bugs/${bugId}`); return { success: true, message: "Status updated successfully" }; } catch (error) { return { success: false, message: error instanceof AppError ? error.message : "Unable to update status" }; } }
