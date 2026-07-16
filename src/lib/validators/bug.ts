import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const optionalDate = z.union([z.iso.date(), z.literal("")]).optional();

export const bugInputSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  title: z.string().trim().min(5, "Title must contain at least 5 characters").max(200),
  description: z.string().trim().min(10, "Description must contain at least 10 characters").max(10_000),
  reproductionSteps: optionalText(10_000),
  expectedResult: optionalText(5_000),
  actualResult: optionalText(5_000),
  environment: optionalText(500),
  browser: optionalText(100),
  operatingSystem: optionalText(100),
  applicationVersion: optionalText(100),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]).default("MAJOR"),
  dueDate: optionalDate,
});

export const bugUpdateSchema = bugInputSchema.omit({ projectId: true });

export const bugQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  projectId: z.string().optional(),
  status: z.enum(["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "READY_FOR_TEST", "REOPENED", "CLOSED", "REJECTED", "DUPLICATE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]).optional(),
  assigneeId: z.string().optional(),
  reporterId: z.string().optional(),
  overdue: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "dueDate", "priority", "severity"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const assignBugSchema = z.object({ assigneeId: z.union([z.string().min(1), z.null(), z.literal("")]).transform((value) => value || null) });
export const prioritySchema = z.object({ priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]) });
export const severitySchema = z.object({ severity: z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]) });

export type BugInput = z.infer<typeof bugInputSchema>;
export type BugUpdateInput = z.infer<typeof bugUpdateSchema>;
export type BugQuery = z.infer<typeof bugQuerySchema>;
