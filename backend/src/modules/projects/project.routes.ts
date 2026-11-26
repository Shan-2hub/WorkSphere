import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";

import {
  createProjectController,
  getOrganizationProjectsController,
  getProjectByIdController,
  updateProjectController,
  archiveProjectController,
} from "./project.controller.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post("/", createProjectController);
router.get("/", getOrganizationProjectsController);
router.get("/:projectId", getProjectByIdController);
router.patch("/:projectId", updateProjectController);
router.delete("/:projectId", archiveProjectController);

export default router;