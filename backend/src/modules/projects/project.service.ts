import { prisma } from "../../prisma/client.js";
import type { CreateProjectInput, UpdateProjectInput } from "./project.validation.js";

export async function createProject(
  userId: string,
  organizationId: string,
  input: CreateProjectInput
) {
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!membership || membership.organization.isArchived) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }

  if (membership.role === "MEMBER") {
    throw new Error("FORBIDDEN");
  }

  return prisma.project.create({
    data: {
      organizationId,
      name: input.name,
      description: input.description,
      color: input.color,
      startDate: input.startDate,
      dueDate: input.dueDate,
      createdById: userId,
    },
  });
}

export async function getOrganizationProjects(
  userId: string,
  organizationId: string
) {
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!membership || membership.organization.isArchived) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }

  return prisma.project.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProjectById(
  userId: string,
  organizationId: string,
  projectId: string
) {
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!membership || membership.organization.isArchived) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
    },
  });

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  return project;
}

export async function updateProject(
  userId: string,
  organizationId: string,
  projectId: string,
  input: UpdateProjectInput
) {
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!membership || membership.organization.isArchived) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }

  if (membership.role === "MEMBER") {
    throw new Error("FORBIDDEN");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
    },
  });

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: input,
  });
}

export async function archiveProject(
  userId: string,
  organizationId: string,
  projectId: string
) {
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!membership || membership.organization.isArchived) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }

  if (membership.role !== "OWNER") {
    throw new Error("FORBIDDEN");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
    },
  });

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      status: "ARCHIVED",
    },
  });
}