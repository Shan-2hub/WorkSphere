import { prisma } from "../../prisma/client.js";
import { ProjectStatus } from "@prisma/client";
import type { CreateTaskInput, UpdateTaskInput } from "./task.validation.js";

async function verifyMembership(organizationId: string, userId: string) {
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

  return membership;
}

async function verifyAssignee(
  organizationId: string,
  assigneeId?: string | null,
) {
  if (!assigneeId) return;

  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: assigneeId,
      },
    },
  });

  if (!membership) {
    throw new Error("ASSIGNEE_NOT_IN_ORGANIZATION");
  }
}

export async function createTask(
  organizationId: string,
  projectId: string,
  userId: string,
  input: CreateTaskInput,
) {
  await verifyMembership(organizationId, userId);
  await verifyAssignee(organizationId, input.assigneeId);

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
      status: { not: ProjectStatus.ARCHIVED },
      organization: { isArchived: false },
    },
  });

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        organizationId,
        projectId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
        createdById: userId,
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "TASK_CREATED",
        entityType: "TASK",
        entityId: task.id,
        metadata: { title: task.title, projectId },
      },
    });

    return task;
  });
}

export async function listTasks(
  organizationId: string,
  projectId: string,
  userId: string,
) {
  await verifyMembership(organizationId, userId);

  return prisma.task.findMany({
    where: {
      organizationId,
      projectId,
      project: { organizationId },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTaskById(
  organizationId: string,
  projectId: string,
  taskId: string,
  userId: string,
) {
  await verifyMembership(organizationId, userId);

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId,
      projectId,
    },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  return task;
}

export async function updateTask(
  organizationId: string,
  projectId: string,
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
) {
  await verifyMembership(organizationId, userId);
  await verifyAssignee(organizationId, input.assigneeId);

  const { expectedVersion, ...updateData } = input;

  return prisma.$transaction(async (tx) => {
    const result = await tx.task.updateMany({
      where: {
        id: taskId,
        organizationId,
        projectId,
        version: expectedVersion,
      },
      data: {
        ...updateData,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      const existingTask = await tx.task.findFirst({
        where: {
          id: taskId,
          organizationId,
          projectId,
        },
        select: { id: true },
      });

      if (!existingTask) {
        throw new Error("TASK_NOT_FOUND");
      }

      throw new Error("TASK_VERSION_CONFLICT");
    }

    const updatedTask = await tx.task.findFirst({
      where: {
        id: taskId,
        organizationId,
        projectId,
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "TASK_UPDATED",
        entityType: "TASK",
        entityId: taskId,
        metadata: { updatedFields: Object.keys(updateData) },
      },
    });

    return updatedTask;
  });
}