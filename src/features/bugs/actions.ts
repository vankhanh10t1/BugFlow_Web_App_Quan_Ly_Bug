"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assignBugSchema, bugInputSchema, bugUpdateSchema, prioritySchema, severitySchema } from "@/lib/validators/bug";
import { assignBug, createBug, updateBug, updateBugPriority, updateBugSeverity } from "@/features/bugs/service";

export type BugActionState = { success: boolean; message: string; fieldErrors?: Record<string, string[]> } | undefined;
const fail = (error: unknown): BugActionState => ({ success: false, message: error instanceof AppError ? error.message : "Unable to complete the request" });

export async function createBugAction(_: BugActionState, formData: FormData): Promise<BugActionState> {
  const actor = await requireActiveUser(); const parsed = bugInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors };
  let id: string; try { await enforceUserMutationLimit("bug:create", actor.id); id = (await createBug(actor, parsed.data)).id; } catch (error) { return fail(error); } redirect(`/bugs/${id}`);
}

export async function updateBugAction(bugId: string, _: BugActionState, formData: FormData): Promise<BugActionState> {
  const actor = await requireActiveUser(); const parsed = bugUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors };
  try { await enforceUserMutationLimit("bug:update", actor.id, 30); await updateBug(bugId, actor, parsed.data); revalidatePath(`/bugs/${bugId}`); return { success: true, message: "Bug updated successfully" }; } catch (error) { return fail(error); }
}

export async function assignBugAction(bugId: string, _: BugActionState, formData: FormData): Promise<BugActionState> {
  const actor = await requireActiveUser(); const parsed = assignBugSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Select a valid assignee" };
  try { await assignBug(bugId, actor, parsed.data.assigneeId); revalidatePath(`/bugs/${bugId}`); return { success: true, message: parsed.data.assigneeId ? "Bug assigned successfully" : "Bug unassigned successfully" }; } catch (error) { return fail(error); }
}

export async function selfAssignBugAction(bugId: string) { const actor = await requireActiveUser(); await assignBug(bugId, actor, actor.id); revalidatePath(`/bugs/${bugId}`); }

export async function updatePriorityAction(bugId: string, formData: FormData) { const actor = await requireActiveUser(); const parsed = prioritySchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid priority", 400); await updateBugPriority(bugId, actor, parsed.data.priority); revalidatePath(`/bugs/${bugId}`); }
export async function updateSeverityAction(bugId: string, formData: FormData) { const actor = await requireActiveUser(); const parsed = severitySchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid severity", 400); await updateBugSeverity(bugId, actor, parsed.data.severity); revalidatePath(`/bugs/${bugId}`); }
