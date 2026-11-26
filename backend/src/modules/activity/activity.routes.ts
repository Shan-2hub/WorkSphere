import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { getActivityController } from "./activity.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/", getActivityController);

export default router;