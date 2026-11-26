import type { Request, Response } from "express";
import {
  createInvitationSchema,
  listInvitationsQuerySchema,
  acceptInvitationSchema,
  invitationIdSchema,
} from "./invitation.validation.js";
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
  acceptInvitation,
} from "./invitation.service.js";

type OrganizationRouteParams = {
  organizationId: string;
};

type InvitationRouteParams = {
  organizationId: string;
  invitationId: string;
};

function handleError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

  const errorMap: Record<string, { status: number; message: string }> = {
    FORBIDDEN: { status: 403, message: "Forbidden" },
    ADMIN_REQUIRED: { status: 403, message: "Organization admin required" },
    ORGANIZATION_NOT_FOUND: { status: 404, message: "Organization not found" },
    ORGANIZATION_ARCHIVED: { status: 403, message: "Organization is archived" },
    USER_ALREADY_MEMBER: { status: 409, message: "User is already a member" },
    INVITATION_ALREADY_PENDING: { status: 409, message: "A pending invitation already exists" },
    INVITATION_NOT_FOUND: { status: 404, message: "Invitation not found" },
    INVITATION_NOT_PENDING: { status: 400, message: "Invitation is not pending" },
    INVITATION_EXPIRED: { status: 400, message: "Invitation has expired" },
    INVITATION_EMAIL_MISMATCH: { status: 403, message: "Invitation email does not match your account" },
    USER_NOT_FOUND: { status: 404, message: "User not found" },
    ORGANIZATION_UNAVAILABLE: { status: 403, message: "Organization is unavailable" },
  };

  const mapped = errorMap[message];

  if (mapped) {
    return res.status(mapped.status).json({
      success: false,
      message: mapped.message,
    });
  }

  console.error("Invitation controller error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export async function createInvitationController(
  req: Request<OrganizationRouteParams>,
  res: Response,
) {
  try {
    const parsed = createInvitationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const invitation = await createInvitation(
      req.params.organizationId,
      req.user!.id,
      parsed.data,
    );

    return res.status(201).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listInvitationsController(
  req: Request<OrganizationRouteParams>,
  res: Response,
) {
  try {
    const parsed = listInvitationsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const result = await listInvitations(
      req.params.organizationId,
      req.user!.id,
      parsed.data,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function revokeInvitationController(
  req: Request<InvitationRouteParams>,
  res: Response,
) {
  try {
    const parsed = invitationIdSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation ID",
        errors: parsed.error.flatten(),
      });
    }

    const invitation = await revokeInvitation(
      req.params.organizationId,
      req.user!.id,
      parsed.data.invitationId,
    );

    return res.status(200).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function acceptInvitationController(
  req: Request,
  res: Response,
) {
  try {
    const parsed = acceptInvitationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const invitation = await acceptInvitation(
      req.user!.id,
      parsed.data.token,
    );

    return res.status(200).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    return handleError(res, error);
  }
}