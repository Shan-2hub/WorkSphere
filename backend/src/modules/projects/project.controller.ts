import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

import {
  createProject,
  getOrganizationProjects,
  getProjectById,
  updateProject,
  archiveProject,
} from "./project.service.js";

import {
  createProjectSchema,
  updateProjectSchema,
} from "./project.validation.js";

export async function createProjectController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const organizationId = req.params.organizationId as string;
    const projectId = req.params.projectId as string;


    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsed = createProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const project = await createProject(userId, organizationId, parsed.data);

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "ORGANIZATION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    if (message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to perform this action",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
}

export async function getOrganizationProjectsController(
  req: Request,
  res: Response
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const organizationId = req.params.organizationId as string;
    const projectId = req.params.projectId as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const projects = await getOrganizationProjects(userId, organizationId);

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "ORGANIZATION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
}

export async function getProjectByIdController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const organizationId = req.params.organizationId as string;
    const projectId = req.params.projectId as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const project = await getProjectById(userId, organizationId, projectId);

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "ORGANIZATION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    if (message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
}

export async function updateProjectController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const organizationId = req.params.organizationId as string;
    const projectId = req.params.projectId as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const parsed = updateProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const project = await updateProject(
      userId,
      organizationId,
      projectId,
      parsed.data
    );

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "ORGANIZATION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    if (message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
}

export async function archiveProjectController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const organizationId = req.params.organizationId as string;
    const projectId = req.params.projectId as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const project = await archiveProject(userId, organizationId, projectId);

    return res.status(200).json({
      success: true,
      message: "Project archived successfully",
      data: project,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "ORGANIZATION_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    if (message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "Only organization owners can archive projects",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to archive project",
    });
  }
}