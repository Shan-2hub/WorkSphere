import { prisma } from "../../prisma/client";
import {
  CreateTeamInput,
  UpdateTeamInput,
  AddTeamMemberInput,
  UpdateTeamMemberRoleInput,
} from "./team.validation";

async function verifyOrganizationMembership(
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

  if (!membership) throw new Error("FORBIDDEN");

  return membership;
}

async function verifyTeam(
  organizationId: string,
  teamId: string,
) {
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      organizationId,
    },
  });

  if (!team) throw new Error("TEAM_NOT_FOUND");

  return team;
}

async function verifyOrganizationAdmin(
  organizationId: string,
  userId: string,
) {
  const membership = await verifyOrganizationMembership(
    organizationId,
    userId,
  );

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("ADMIN_REQUIRED");
  }

  return membership;
}

async function verifyTeamManager(
  organizationId: string,
  teamId: string,
  userId: string,
) {
  const membership = await verifyOrganizationMembership(
    organizationId,
    userId,
  );

  if (["OWNER", "ADMIN"].includes(membership.role)) {
    return;
  }

  const teamMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });

  if (!teamMember || teamMember.role !== "LEAD") {
    throw new Error("TEAM_MANAGER_REQUIRED");
  }
}

export async function createTeam(
  organizationId: string,
  userId: string,
  input: CreateTeamInput,
) {
  await verifyOrganizationAdmin(organizationId, userId);

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        organizationId,
        name: input.name,
        description: input.description,
        createdById: userId,
      },
    });

    // Automatically assign creator as first LEAD
    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: "LEAD",
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "TEAM_CREATED",
        entityType: "TEAM",
        entityId: team.id,
      },
    });

    // Fetch after membership creation so member count is accurate
    return tx.team.findUnique({
      where: { id: team.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });
  });
}

export async function listTeams(
  organizationId: string,
  userId: string,
) {
  await verifyOrganizationMembership(organizationId, userId);

  return prisma.team.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { members: true },
      },
    },
  });
}

export async function getTeam(
  organizationId: string,
  teamId: string,
  userId: string,
) {
  await verifyOrganizationMembership(organizationId, userId);
  await verifyTeam(organizationId, teamId);

  return prisma.team.findFirst({
    where: {
      id: teamId,
      organizationId,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

export async function updateTeam(
  organizationId: string,
  teamId: string,
  userId: string,
  input: UpdateTeamInput,
) {
  await verifyOrganizationAdmin(organizationId, userId);
  await verifyTeam(organizationId, teamId);

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.update({
      where: { id: teamId },
      data: input,
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "TEAM_UPDATED",
        entityType: "TEAM",
        entityId: teamId,
      },
    });

    return team;
  });
}

export async function deleteTeam(
  organizationId: string,
  teamId: string,
  userId: string,
) {
  await verifyOrganizationAdmin(organizationId, userId);
  await verifyTeam(organizationId, teamId);

  return prisma.$transaction(async (tx) => {
    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "TEAM_DELETED",
        entityType: "TEAM",
        entityId: teamId,
      },
    });

    await tx.team.delete({
      where: { id: teamId },
    });

    return { deleted: true };
  });
}

export async function addTeamMember(
  organizationId: string,
  teamId: string,
  userId: string,
  input: AddTeamMemberInput,
) {
  await verifyTeamManager(organizationId, teamId, userId);
  await verifyTeam(organizationId, teamId);

  // Verify target user belongs to this organization
  const targetMembership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: input.userId,
      },
    },
  });

  if (!targetMembership) {
    throw new Error("USER_NOT_IN_ORGANIZATION");
  }

  // Prevent duplicate team membership
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: input.userId,
      },
    },
  });

  if (existingMember) {
    throw new Error("TEAM_MEMBER_EXISTS");
  }

  return prisma.$transaction(async (tx) => {
    const member = await tx.teamMember.create({
      data: {
        teamId,
        userId: input.userId,
        role: input.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "TEAM_MEMBER_ADDED",
        entityType: "TEAM",
        entityId: teamId,
        metadata: {
          memberUserId: input.userId,
          role: input.role,
        },
      },
    });

    return member;
  });
}

export async function updateTeamMemberRole(
  organizationId: string,
  teamId: string,
  targetUserId: string,
  userId: string,
  input: UpdateTeamMemberRoleInput,
) {
  await verifyTeamManager(organizationId, teamId, userId);
  await verifyTeam(organizationId, teamId);

  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
  });

  if (!existingMember) {
    throw new Error("TEAM_MEMBER_NOT_FOUND");
  }

  // Prevent removing/demoting the last team LEAD
  if (existingMember.role === "LEAD" && input.role !== "LEAD") {
    const leadCount = await prisma.teamMember.count({
      where: {
        teamId,
        role: "LEAD",
      },
    });

    if (leadCount <= 1) {
      throw new Error("LAST_TEAM_LEAD");
    }
  }

  return prisma.$transaction(async (tx) => {
    const member = await tx.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      data: { role: input.role },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "TEAM_MEMBER_ROLE_UPDATED",
        entityType: "TEAM",
        entityId: teamId,
        metadata: {
          memberUserId: targetUserId,
          role: input.role,
        },
      },
    });

    return member;
  });
}

export async function removeTeamMember(
  organizationId: string,
  teamId: string,
  targetUserId: string,
  userId: string,
) {
  await verifyTeamManager(organizationId, teamId, userId);
  await verifyTeam(organizationId, teamId);

  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
  });

  if (!existingMember) {
    throw new Error("TEAM_MEMBER_NOT_FOUND");
  }

  if (existingMember.role === "LEAD") {
    const leadCount = await prisma.teamMember.count({
      where: {
        teamId,
        role: "LEAD",
      },
    });

    if (leadCount <= 1) {
      throw new Error("LAST_TEAM_LEAD");
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId: userId,
        action: "TEAM_MEMBER_REMOVED",
        entityType: "TEAM",
        entityId: teamId,
        metadata: {
          memberUserId: targetUserId,
        },
      },
    });

    return { removed: true };
  });
}