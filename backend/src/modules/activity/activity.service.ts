import { prisma } from "../../prisma/client";
import { ActivityQuery } from "./activity.validation";

export async function getOrganizationActivity(
  organizationId: string,
  userId: string,
  query: ActivityQuery,
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

  const where = {
    organizationId,
    ...(query.action ? { action: query.action } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
  };

  const skip = (query.page - 1) * query.limit;

  const [activities, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: query.limit,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    activities,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}