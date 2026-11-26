import { Request, Response } from "express";
import { createCommentSchema } from "./comment.validation";
import {
  createComment,
  listTaskComments,
} from "./comment.service";


type CommentRouteParams = {
  organizationId: string;
  projectId: string;
  taskId: string;
};

export async function createCommentController(
    req: Request<CommentRouteParams>,
    res: Response,
) {
  try {
    const input = createCommentSchema.parse(req.body);

    const comment = await createComment(
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId,
      req.user!.id,
      input,
    );

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (error.message === "TASK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Invalid comment data",
        errors: error.issues,
      });
    }

    console.error("Create comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create comment",
    });
  }
}

export async function listCommentsController(
    req: Request<CommentRouteParams>,
    res: Response,  
) {
  try {
    const comments = await listTaskComments(
      req.params.organizationId,
      req.params.projectId,
      req.params.taskId,
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (error.message === "TASK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    console.error("List comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve comments",
    });
  }
}