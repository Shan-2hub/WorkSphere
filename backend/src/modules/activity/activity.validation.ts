import { z } from "zod";

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
});

export type ActivityQuery = z.infer<typeof activityQuerySchema>;