import type { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.validation.js";
import * as authService from "./auth.service.js";

export async function registerController(
  req: Request,
  res: Response
): Promise<void> {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const result = await authService.register(validation.data);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
}

export async function loginController(
  req: Request,
  res: Response
): Promise<void> {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const result = await authService.login(validation.data);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
}

export async function refreshController(
  req: Request,
  res: Response
): Promise<void> {
  const refreshToken = req.body?.refreshToken;

  if (
    typeof refreshToken !== "string" ||
    refreshToken.length === 0
  ) {
    res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
    return;
  }

  try {
    const tokens = await authService.rotateRefreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: tokens,
    });
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
}

export async function logoutController(
  req: Request,
  res: Response
): Promise<void> {
  const refreshToken = req.body?.refreshToken;

  if (
    typeof refreshToken !== "string" ||
    refreshToken.length === 0
  ) {
    res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
    return;
  }

  try {
    await authService.logout(refreshToken);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
}

import { prisma } from "../../prisma/client.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

export async function meController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
}