import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(5000).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assigneeId: z.string().optional(),
    dueDate: z.coerce.date().optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assigneeId: z.string().nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    expectedVersion: z.number().int().positive(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).some((key) => key !== "expectedVersion"),
    { message: "At least one field must be updated" },
  );

export const taskIdSchema = z.object({
  taskId: z.string().min(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;