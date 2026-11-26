import { randomBytes, createHash } from "node:crypto";
import { prisma } from "../../prisma/client.js";
import type {
  CreateInvitationInput,
  ListInvitationsQuery,
} from "./invitation.validation.js";

const INVITATION_EXPIRY_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sanitizeInvitation<T extends { tokenHash: string }>(invitation: T) {
  const { tokenHash, ...safeInvitation } = invitation;
  return safeInvitation;
}

async function verifyOrganizationAdmin(
  organizationId: string,
  userId: string,
) {
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

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("ADMIN_REQUIRED");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, isArchived: true },
  });

  if (!organization) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }

  if (organization.isArchived) {
    throw new Error("ORGANIZATION_ARCHIVED");
  }

  return membership;
}

export async function createInvitation(
  organizationId: string,
  userId: string,
  input: CreateInvitationInput,
) {
  await verifyOrganizationAdmin(organizationId, userId);

  const email = input.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: existingUser.id,
        },
      },
    });

    if (existingMembership) {
      throw new Error("USER_ALREADY_MEMBER");
    }
  }

  const pendingInvitation = await prisma.invitation.findFirst({
    where: {
      organizationId,
      invitedEmail: email,
      status: "PENDING",
    },
  });

  if (pendingInvitation) {
    if (pendingInvitation.expiresAt > new Date()) {
      throw new Error("INVITATION_ALREADY_PENDING");
    }

    await prisma.invitation.update({
      where: { id: pendingInvitation.id },
      data: { status: "EXPIRED" },
    });
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const invitation = await prisma.$transaction(async (tx) => {
    const created = await tx.invitation.create({
      data: {
        organizationId,
        invitedEmail: email,
        invitedUserId: existingUser?.id ?? null,
        role: input.role,
        tokenHash,
        invitedById: userId,
        expiresAt,
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "INVITATION_CREATED",
        entityType: "INVITATION",
        entityId: created.id,
        metadata: {
          email,
          role: input.role,
        },
      },
    });

    return created;
  });

  return {
    ...sanitizeInvitation(invitation),
    token: rawToken,
};
}

export async function listInvitations(
  organizationId: string,
  userId: string,
  query: ListInvitationsQuery,
) {
  await verifyOrganizationAdmin(organizationId, userId);

  const where = {
    organizationId,
    ...(query.status ? { status: query.status } : {}),
  };

  const skip = (query.page - 1) * query.limit;

  const [invitations, total] = await prisma.$transaction([
    prisma.invitation.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
        invitedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.invitation.count({ where }),
  ]);

  return {
    invitations: invitations.map((invitation) =>
        sanitizeInvitation(invitation),
    ),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function revokeInvitation(
  organizationId: string,
  userId: string,
  invitationId: string,
) {
  await verifyOrganizationAdmin(organizationId, userId);

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
    },
  });

  if (!invitation) {
    throw new Error("INVITATION_NOT_FOUND");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("INVITATION_NOT_PENDING");
  }

  if (invitation.expiresAt <= new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });

    throw new Error("INVITATION_EXPIRED");
  }

  return prisma.$transaction(async (tx) => {
    const revoked = await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "REVOKED" },
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "INVITATION_REVOKED",
        entityType: "INVITATION",
        entityId: invitation.id,
      },
    });

    return sanitizeInvitation(revoked);
  });
}

export async function acceptInvitation(
  userId: string,
  token: string,
) {
  const tokenHash = hashToken(token);

  const existingInvitation = await prisma.invitation.findUnique({
     where: { tokenHash },
  });

  if (!existingInvitation) {
    throw new Error("INVITATION_NOT_FOUND");
  }

  if (
    existingInvitation.status === "PENDING" &&
    existingInvitation.expiresAt <= new Date()
  ) {
    await prisma.invitation.update({
        where: { id: existingInvitation.id },
        data: { status: "EXPIRED" },
    });

    throw new Error("INVITATION_EXPIRED");
  }

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation) {
      throw new Error("INVITATION_NOT_FOUND");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("INVITATION_NOT_PENDING");
    }

    if (invitation.expiresAt <= new Date()) {
        throw new Error("INVITATION_EXPIRED");
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
      throw new Error("INVITATION_EMAIL_MISMATCH");
    }

    const existingMembership = await tx.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId,
        },
      },
    });

    if (existingMembership) {
      throw new Error("USER_ALREADY_MEMBER");
    }

    const organization = await tx.organization.findUnique({
      where: { id: invitation.organizationId },
      select: { isArchived: true },
    });

    if (!organization || organization.isArchived) {
      throw new Error("ORGANIZATION_UNAVAILABLE");
    }

    await tx.membership.create({
      data: {
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
      },
    });

    const accepted = await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        invitedUserId: userId,
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId: invitation.organizationId,
        actorId: userId,
        action: "INVITATION_ACCEPTED",
        entityType: "INVITATION",
        entityId: invitation.id,
      },
    });

    return sanitizeInvitation(accepted);
  });
}