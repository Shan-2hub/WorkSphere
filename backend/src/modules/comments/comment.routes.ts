import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import {
  createCommentController,
  listCommentsController,
} from "./comment.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post("/", createCommentController);
router.get("/", listCommentsController);

export default router;