import { prisma } from "../../prisma/client.js";
import type { CreateOrganizationInput } from "./organization.validation.js";
import { randomBytes } from "crypto";
import type { UpdateOrganizationInput } from "./organization.validation.js";


function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const suffix = randomBytes(3).toString("hex");

  return `${baseSlug}-${suffix}`;
}

export async function createOrganization(
  userId: string,
  input: CreateOrganizationInput
) {
  const slug = generateSlug(input.name);

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.name,
        slug,
        ownerId: userId,
      },
    });

    await tx.membership.create({
        data: {
            organizationId: organization.id,
            userId,
            role: "OWNER",
        },
    });

    return organization;
  });
}

export async function getUserOrganizations(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
    },
    include: {
      organization: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  return memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
    joinedAt: membership.joinedAt,
    createdAt: membership.organization.createdAt,
  }));
}

export async function getOrganizationById(
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
    return null;
  }

  return {
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
    ownerId: membership.organization.ownerId,
    isArchived: membership.organization.isArchived,
    createdAt: membership.organization.createdAt,
    updatedAt: membership.organization.updatedAt,
  };
}

export async function updateOrganization(
  userId: string,
  organizationId: string,
  input: UpdateOrganizationInput
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

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
        throw new Error("FORBIDDEN");
    }

  return prisma.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      name: input.name,
    },
  });
}

export async function archiveOrganization(
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

  if (membership.role !== "OWNER") {
    throw new Error("FORBIDDEN");
  }

  return prisma.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      isArchived: true,
    },
  });
}