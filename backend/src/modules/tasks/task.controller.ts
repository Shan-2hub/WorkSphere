import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createTaskSchema,
  updateTaskSchema,
} from "./task.validation.js";

import {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
} from "./task.service.js";

export async function createTaskController(
  req: Request,
  res: Response,
) {
  try {
    const input = createTaskSchema.parse(req.body);

    const task = await createTask(
      req.params.organizationId as string,
      req.params.projectId as string,
      req.user!.id,
      input,
    );

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this organization",
      });
    }

    if (
      error instanceof Error &&
      error.message === "ASSIGNEE_NOT_IN_ORGANIZATION"
    ) {
      return res.status(400).json({
        success: false,
        message: "Assignee must belong to this organization",
      });
    }

    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
}

export async function listTasksController(
  req: Request,
  res: Response,
) {
  try {
    const tasks = await listTasks(
      req.params.organizationId as string,
      req.params.projectId as string,
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    console.error("List tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
}

export async function getTaskController(
  req: Request,
  res: Response,
) {
  try {
    const task = await getTaskById(
      req.params.organizationId as string,
      req.params.projectId as string,
      req.params.taskId as string,
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (error instanceof Error && error.message === "TASK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    console.error("Get task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch task",
    });
  }
}

export async function updateTaskController(
  req: Request,
  res: Response,
) {
  try {
    const input = updateTaskSchema.parse(req.body);

    const task = await updateTask(
      req.params.organizationId as string,
      req.params.projectId as string,
      req.params.taskId as string,
      req.user!.id,
      input,
    );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      error instanceof Error &&
      error.message === "ASSIGNEE_NOT_IN_ORGANIZATION"
    ) {
      return res.status(400).json({
        success: false,
        message: "Assignee must belong to this organization",
      });
    }

    if (error instanceof Error && error.message === "TASK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (
      error instanceof Error &&
      error.message === "TASK_VERSION_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message: "Task was modified by another user. Refresh and try again.",
      });
    }

    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
}