import { z } from "zod";

const optionalDate = z.union([z.iso.date(), z.literal("")]).optional();

export const projectInputSchema = z
  .object({
    code: z.string().trim().toUpperCase().min(2).max(10).regex(/^[A-Z][A-Z0-9_]*$/, "Use 2–10 uppercase letters, numbers, or underscores"),
    name: z.string().trim().min(3, "Project name must contain at least 3 characters").max(100),
    description: z.string().trim().max(2000).optional(),
    status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).default("PLANNING"),
    startDate: optionalDate,
    expectedEndDate: optionalDate,
  })
  .refine((data) => !data.startDate || !data.expectedEndDate || data.expectedEndDate >= data.startDate, {
    message: "Expected end date must be on or after the start date",
    path: ["expectedEndDate"],
  });

export const projectQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, "Select a user"),
  role: z.enum(["MANAGER", "TESTER", "DEVELOPER", "VIEWER"]),
});

export const updateProjectMemberSchema = z.object({ role: z.enum(["MANAGER", "TESTER", "DEVELOPER", "VIEWER"]) });

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
