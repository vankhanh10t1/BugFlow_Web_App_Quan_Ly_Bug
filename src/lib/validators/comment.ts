import { z } from "zod";

export const commentSchema = z.object({ content: z.string().trim().min(1, "Comment cannot be empty").max(5_000, "Comment is too long") });
export type CommentInput = z.infer<typeof commentSchema>;
