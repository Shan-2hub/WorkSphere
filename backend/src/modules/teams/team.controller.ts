import { Request, Response } from "express";
import {
  createTeamSchema,
  updateTeamSchema,
  addTeamMemberSchema,
  updateTeamMemberRoleSchema,
} from "./team.validation";

import {
  createTeam,
  listTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "./team.service";

type TeamParams = {
  organizationId: string;
  teamId: string;
};

type TeamMemberParams = {
  organizationId: string;
  teamId: string;
  userId: string;
};

function handleError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";

  const statusMap: Record<string, number> = {
    FORBIDDEN: 403,
    ADMIN_REQUIRED: 403,
    TEAM_MANAGER_REQUIRED: 403,
    TEAM_NOT_FOUND: 404,
    TEAM_MEMBER_NOT_FOUND: 404,
    USER_NOT_IN_ORGANIZATION: 400,
    LAST_TEAM_LEAD: 400,
    TEAM_MEMBER_EXISTS: 409,
  };

  return res.status(statusMap[message] ?? 500).json({
    success: false,
    message: statusMap[message] ? message : "Internal server error",
  });
}

export async function createTeamController(
  req: Request<{ organizationId: string }>,
  res: Response,
) {
  try {
    const parsed = createTeamSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten(),
      });
    }

    const team = await createTeam(
      req.params.organizationId,
      req.user!.id,
      parsed.data,
    );

    return res.status(201).json({
      success: true,
      data: team,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listTeamsController(
  req: Request<{ organizationId: string }>,
  res: Response,
) {
  try {
    const teams = await listTeams(
      req.params.organizationId,
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getTeamController(
  req: Request<TeamParams>,
  res: Response,
) {
  try {
    const team = await getTeam(
      req.params.organizationId,
      req.params.teamId,
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateTeamController(
  req: Request<TeamParams>,
  res: Response,
) {
  try {
    const parsed = updateTeamSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten(),
      });
    }

    const team = await updateTeam(
      req.params.organizationId,
      req.params.teamId,
      req.user!.id,
      parsed.data,
    );

    return res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteTeamController(
  req: Request<TeamParams>,
  res: Response,
) {
  try {
    const result = await deleteTeam(
      req.params.organizationId,
      req.params.teamId,
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function addTeamMemberController(
  req: Request<TeamParams>,
  res: Response,
) {
  try {
    const parsed = addTeamMemberSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten(),
      });
    }

    const member = await addTeamMember(
      req.params.organizationId,
      req.params.teamId,
      req.user!.id,
      parsed.data,
    );

    return res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateTeamMemberRoleController(
  req: Request<TeamMemberParams>,
  res: Response,
) {
  try {
    const parsed = updateTeamMemberRoleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: parsed.error.flatten(),
      });
    }

    const member = await updateTeamMemberRole(
      req.params.organizationId,
      req.params.teamId,
      req.params.userId,
      req.user!.id,
      parsed.data,
    );

    return res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function removeTeamMemberController(
  req: Request<TeamMemberParams>,
  res: Response,
) {
  try {
    const result = await removeTeamMember(
      req.params.organizationId,
      req.params.teamId,
      req.params.userId,
      req.user!.id,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
}