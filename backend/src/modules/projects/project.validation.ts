import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(100),
  description: z.string().trim().max(2000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
}).strict().refine(
  (data) => !data.startDate || !data.dueDate || data.dueDate >= data.startDate,
  { message: "Due date cannot be before start date", path: ["dueDate"] }
);

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  status: z.enum([
    "PLANNING",
    "ACTIVE",
    "ON_HOLD",
    "COMPLETED",
    "ARCHIVED",
  ]).optional(),
  startDate: z.coerce.date().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;