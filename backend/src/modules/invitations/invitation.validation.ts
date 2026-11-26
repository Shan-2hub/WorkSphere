import { z } from "zod";

export const createInvitationSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  })
  .strict();

export const invitationIdSchema = z.object({
  invitationId: z.string().min(1),
});

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(32, "Invalid invitation token"),
  })
  .strict();

export const listInvitationsQuerySchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type ListInvitationsQuery = z.infer<typeof listInvitationsQuerySchema>;