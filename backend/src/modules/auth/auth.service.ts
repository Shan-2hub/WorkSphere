import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { prisma } from "../../prisma/client.js";
import type { RegisterInput, LoginInput } from "./auth.validation.js";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

function getAccessTokenSecret(): string {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return ACCESS_TOKEN_SECRET;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    getAccessTokenSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

async function createRefreshToken(userId: string) {
  const rawToken = randomBytes(64).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return rawToken;
}

async function createAuthTokens(userId: string) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = await createRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
  };
}

export async function register(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  const tokens = await createAuthTokens(user.id);

  return {
    user,
    ...tokens,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.isActive) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const tokens = await createAuthTokens(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    ...tokens,
  };
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const existingToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (
    !existingToken ||
    existingToken.revokedAt ||
    existingToken.expiresAt <= new Date()
  ) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  // Prepare the replacement token
  const newRawToken = randomBytes(64).toString("hex");
  const newTokenHash = hashToken(newRawToken);

  const newExpiresAt = new Date();
  newExpiresAt.setDate(
    newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS
  );

  // Atomically revoke the old token and create a replacement.
  const rotated = await prisma.$transaction(async (tx) => {
    const revokeResult = await tx.refreshToken.updateMany({
      where: {
        id: existingToken.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revokeResult.count !== 1) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    await tx.refreshToken.create({
      data: {
        userId: existingToken.userId,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      },
    });

    return existingToken.userId;
  });

  return {
    accessToken: generateAccessToken(rotated),
    refreshToken: newRawToken,
  };
}

export async function logout(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const result = await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return {
    revoked: result.count > 0,
  };
}