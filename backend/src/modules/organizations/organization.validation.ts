import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters"),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters")
}).strict();

export type UpdateOrganizationInput = z.infer<
  typeof updateOrganizationSchema
>;

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationSchema
>;