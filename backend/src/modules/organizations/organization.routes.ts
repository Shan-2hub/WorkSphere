import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import {
  createOrganizationController,
  getUserOrganizationsController,
  getOrganizationByIdController,
  updateOrganizationController,
  archiveOrganizationController,
} from "./organization.controller.js";

const router = Router();

// Create an organization
router.post("/", authenticate, createOrganizationController);

// Get organizations belonging to the authenticated user
router.get("/", authenticate, getUserOrganizationsController);

router.get("/:organizationId", authenticate, getOrganizationByIdController);

// Update organization (OWNER / ADMIN only)
router.patch("/:organizationId", authenticate, updateOrganizationController);

// Archive organization (OWNER only)
router.delete(
  "/:organizationId",
  authenticate,
  archiveOrganizationController
);

export default router;