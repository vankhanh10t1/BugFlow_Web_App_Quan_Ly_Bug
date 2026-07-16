"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { addProjectMemberSchema, projectInputSchema, updateProjectMemberSchema } from "@/lib/validators/project";
import { addProjectMember, archiveProject, createProject, removeProjectMember, updateProject, updateProjectMemberRole } from "@/features/projects/service";

export type ProjectActionState = { success: boolean; message: string; fieldErrors?: Record<string, string[]> } | undefined;

function failure(error: unknown): ProjectActionState {
  return { success: false, message: error instanceof AppError ? error.message : "Unable to complete the request" };
}

export async function createProjectAction(_: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const actor = await requireActiveUser();
  const parsed = projectInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors };
  let projectId: string;
  try { projectId = (await createProject(actor, parsed.data)).id; } catch (error) { return failure(error); }
  redirect(`/projects/${projectId}`);
}

export async function updateProjectAction(projectId: string, _: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const actor = await requireActiveUser();
  const parsed = projectInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors };
  try { await updateProject(projectId, actor, parsed.data); revalidatePath(`/projects/${projectId}`); return { success: true, message: "Project updated successfully" }; } catch (error) { return failure(error); }
}

export async function archiveProjectAction(projectId: string) {
  const actor = await requireActiveUser();
  await archiveProject(projectId, actor);
  revalidatePath("/projects");
  redirect("/projects");
}

export async function addMemberAction(projectId: string, _: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const actor = await requireActiveUser();
  const parsed = addProjectMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Select a valid user and role", fieldErrors: parsed.error.flatten().fieldErrors };
  try { await addProjectMember(projectId, actor, parsed.data.userId, parsed.data.role); revalidatePath(`/projects/${projectId}`); return { success: true, message: "Member added successfully" }; } catch (error) { return failure(error); }
}

export async function updateMemberRoleAction(projectId: string, memberId: string, formData: FormData) {
  const actor = await requireActiveUser();
  const parsed = updateProjectMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid project role", 400);
  await updateProjectMemberRole(projectId, memberId, actor, parsed.data.role);
  revalidatePath(`/projects/${projectId}/settings`);
}

export async function removeMemberAction(projectId: string, memberId: string) {
  const actor = await requireActiveUser();
  await removeProjectMember(projectId, memberId, actor);
  revalidatePath(`/projects/${projectId}/settings`);
}
