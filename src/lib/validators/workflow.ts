import { z } from "zod";

export const statusTransitionSchema = z.object({ status: z.enum(["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "READY_FOR_TEST", "REOPENED", "CLOSED", "REJECTED", "DUPLICATE"]) });
