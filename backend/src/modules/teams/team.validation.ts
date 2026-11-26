import { z } from "zod";

export const createTeamSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateTeamSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const teamIdSchema = z.object({
  teamId: z.string().min(1),
});

export const addTeamMemberSchema = z
  .object({
    userId: z.string().min(1),
    role: z.enum(["LEAD", "MEMBER"]).default("MEMBER"),
  })
  .strict();

export const updateTeamMemberRoleSchema = z
  .object({
    role: z.enum(["LEAD", "MEMBER"]),
  })
  .strict();

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type UpdateTeamMemberRoleInput = z.infer<
  typeof updateTeamMemberRoleSchema
>;