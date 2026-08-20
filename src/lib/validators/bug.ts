import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const optionalDate = z.union([z.iso.date(), z.literal("")]).optional();
const optionalId = z.string().trim().max(100).optional();
const idList = z.preprocess((value) => typeof value === "string" ? value.split(",").filter(Boolean) : value, z.array(z.string().min(1)).max(20).optional());

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
  componentId: optionalId,
  versionId: optionalId,
  labelIds: idList,
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
  deadline: z.enum(["today", "next7days", "overdue", "none"]).optional(),
  unassigned: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  overdue: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  labelId: z.string().optional(),
  componentId: z.string().optional(),
  versionId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "dueDate", "priority", "severity"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const assignBugSchema = z.object({ assigneeId: z.union([z.string().min(1), z.null(), z.literal("")]).transform((value) => value || null) });
export const prioritySchema = z.object({ priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]) });
export const severitySchema = z.object({ severity: z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]) });
export const bugLinkSchema = z.object({
  targetBugId: z.string().trim().min(1).max(100),
  type: z.enum(["DUPLICATE", "BLOCKED_BY", "RELATES_TO"]),
});
export const quickEditBugSchema = z.object({
  assigneeId: z.union([z.string().min(1), z.null()]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "READY_FOR_TEST", "REOPENED", "CLOSED", "REJECTED", "DUPLICATE"]).optional(),
  dueDate: z.union([z.iso.date(), z.literal(""), z.null()]).optional(),
  labelIds: z.array(z.string().min(1)).max(20).optional(),
}).refine((value) => Object.keys(value).length === 1, "Chỉ cập nhật một trường mỗi lần");
export const bulkBugSchema = z.object({
  bugIds: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["assign", "priority", "status"]),
  value: z.string().max(100),
});
export const savedViewSchema = z.object({
  name: z.string().trim().min(1).max(80),
  filters: bugQuerySchema.omit({ page: true, pageSize: true }),
  isDefault: z.boolean().default(false),
});
export const savedViewUpdateSchema = z.object({ name: z.string().trim().min(1).max(80).optional(), isDefault: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0);

export type BugInput = z.infer<typeof bugInputSchema>;
export type BugUpdateInput = z.infer<typeof bugUpdateSchema>;
export type BugQuery = z.infer<typeof bugQuerySchema>;
