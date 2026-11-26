import type { Request, Response } from "express";
import { createOrganizationSchema } from "./organization.validation.js";
import { createOrganization } from "./organization.service.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { getUserOrganizations } from "./organization.service.js";
import { getOrganizationById } from "./organization.service.js";
import { updateOrganizationSchema } from "./organization.validation.js";
import { updateOrganization } from "./organization.service.js";
import { archiveOrganization } from "./organization.service.js";

export async function createOrganizationController(
  req: Request,
  res: Response
) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    const validation = createOrganizationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    if (!authenticatedReq.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }

    const organization = await createOrganization(
        authenticatedReq.user.id,
        validation.data
    );

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: organization,
    });
  } catch (error) {
    console.error("Create organization error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create organization",
    });
  }
}

export async function getUserOrganizationsController(
  req: Request,
  res: Response
) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const organizations = await getUserOrganizations(
      authenticatedReq.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Organizations retrieved successfully",
      data: organizations,
    });
  } catch (error) {
    console.error("Get organizations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve organizations",
    });
  }
}

export async function getOrganizationByIdController(
  req: Request,
  res: Response
) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const organization = await getOrganizationById(
      authenticatedReq.user.id,
      req.params.organizationId as string
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Organization retrieved successfully",
      data: organization,
    });
  } catch (error) {
    console.error("Get organization details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve organization",
    });
  }
}

export async function updateOrganizationController(
  req: Request,
  res: Response
) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const validation = updateOrganizationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const organization = await updateOrganization(
      authenticatedReq.user.id,
      req.params.organizationId as string,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: organization,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Organization not found",
        });
      }

      if (error.message === "FORBIDDEN") {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this organization",
        });
      }
    }

    console.error("Update organization error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update organization",
    });
  }
}

export async function archiveOrganizationController(
  req: Request,
  res: Response
) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const organization = await archiveOrganization(
      authenticatedReq.user.id,
      req.params.organizationId as string
    );

    return res.status(200).json({
      success: true,
      message: "Organization archived successfully",
      data: organization,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Organization not found",
        });
      }

      if (error.message === "FORBIDDEN") {
        return res.status(403).json({
          success: false,
          message: "Only the organization owner can archive it",
        });
      }
    }

    console.error("Archive organization error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive organization",
    });
  }
}