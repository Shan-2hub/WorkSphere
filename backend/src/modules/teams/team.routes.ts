import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";

import {
  createTeamController,
  listTeamsController,
  getTeamController,
  updateTeamController,
  deleteTeamController,
  addTeamMemberController,
  updateTeamMemberRoleController,
  removeTeamMemberController,
} from "./team.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

// Teams
router.post("/", createTeamController);
router.get("/", listTeamsController);
router.get("/:teamId", getTeamController);
router.patch("/:teamId", updateTeamController);
router.delete("/:teamId", deleteTeamController);

// Team members
router.post("/:teamId/members", addTeamMemberController);
router.patch("/:teamId/members/:userId", updateTeamMemberRoleController);
router.delete("/:teamId/members/:userId", removeTeamMemberController);

export default router;