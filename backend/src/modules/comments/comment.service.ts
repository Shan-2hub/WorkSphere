import { prisma } from "../../prisma/client";
import { CreateCommentInput } from "./comment.validation";

export async function createComment(
  organizationId: string,
  projectId: string,
  taskId: string,
  userId: string,
  input: CreateCommentInput,
) {
  // Verify organization membership
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error("FORBIDDEN");
  }

  // Verify task belongs to the specified organization and project
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId,
      projectId,
      project: {
        organizationId,
      },
    },
  });

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  // Create comment and activity log together
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        organizationId,
        taskId,
        authorId: userId,
        content: input.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "COMMENT_CREATED",
        entityType: "COMMENT",
        entityId: comment.id,
        metadata: {
          taskId,
          projectId,
        },
      },
    });

    return comment;
  });
}

export async function listTaskComments(
  organizationId: string,
  projectId: string,
  taskId: string,
  userId: string,
) {
  // Verify organization membership
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error("FORBIDDEN");
  }

  // Verify task access
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId,
      projectId,
      project: {
        organizationId,
      },
    },
  });

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  return prisma.comment.findMany({
    where: {
      organizationId,
      taskId,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}