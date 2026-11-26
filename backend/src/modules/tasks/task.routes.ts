import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";

import {
  createTaskController,
  listTasksController,
  getTaskController,
  updateTaskController,
} from "./task.controller.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post("/", createTaskController);
router.get("/", listTasksController);
router.get("/:taskId", getTaskController);
router.patch("/:taskId", updateTaskController);

export default router;
