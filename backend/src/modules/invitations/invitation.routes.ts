import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import {
  createInvitationController,
  listInvitationsController,
  revokeInvitationController,
  acceptInvitationController,
} from "./invitation.controller.js";

const invitationRouter = Router({ mergeParams: true });

invitationRouter.use(authenticate);

invitationRouter.post("/", createInvitationController);
invitationRouter.get("/", listInvitationsController);
invitationRouter.delete("/:invitationId", revokeInvitationController);

export const acceptInvitationRouter = Router();

acceptInvitationRouter.use(authenticate);
acceptInvitationRouter.post("/accept", acceptInvitationController);

export default invitationRouter;