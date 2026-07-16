"use server";

import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { commentSchema } from "@/lib/validators/comment";
import { createComment, deleteComment, updateComment } from "@/features/comments/service";

export type CommentActionState = { success: boolean; message: string; fieldErrors?: Record<string, string[]> } | undefined;
const fail = (error: unknown): CommentActionState => ({ success: false, message: error instanceof AppError ? error.message : "Unable to complete the request" });

export async function createCommentAction(bugId: string, _: CommentActionState, formData: FormData): Promise<CommentActionState> { const parsed = commentSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { success: false, message: "Enter a valid comment", fieldErrors: parsed.error.flatten().fieldErrors }; try { await createComment(bugId, await requireActiveUser(), parsed.data); revalidatePath(`/bugs/${bugId}`); return { success: true, message: "Comment added successfully" }; } catch (error) { return fail(error); } }
export async function updateCommentAction(bugId: string, commentId: string, _: CommentActionState, formData: FormData): Promise<CommentActionState> { const parsed = commentSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { success: false, message: "Enter a valid comment", fieldErrors: parsed.error.flatten().fieldErrors }; try { await updateComment(commentId, await requireActiveUser(), parsed.data); revalidatePath(`/bugs/${bugId}`); return { success: true, message: "Comment updated" }; } catch (error) { return fail(error); } }
export async function deleteCommentAction(bugId: string, commentId: string) { await deleteComment(commentId, await requireActiveUser()); revalidatePath(`/bugs/${bugId}`); }
