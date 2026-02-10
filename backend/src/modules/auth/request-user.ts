import type { FastifyRequest } from "fastify";
import { env } from "../../config/env.js";
import { unauthorized } from "../../lib/http-error.js";
import { prisma } from "../../services/prisma.js";
import { upsertTelegramUser } from "./auth.service.js";
import { verifySessionToken } from "./session-token.js";
import { validateTelegramInitData } from "./telegram-verify.js";

const DEV_TELEGRAM_ID = 900000000001n;

function extractAuthorizationByScheme(authorizationHeader: unknown, expectedScheme: string): string | null {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const [scheme, ...parts] = authorizationHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== expectedScheme.toLowerCase()) {
    return null;
  }

  const value = parts.join(" ").trim();
  return value.length > 0 ? value : null;
}

async function resolveUserByIdHeader(request: FastifyRequest) {
  if (env.NODE_ENV === "production" || !env.DEV_ALLOW_USER_ID_HEADER) {
    return null;
  }

  const userId = request.headers["x-user-id"];
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return null;
  }

  return prisma.user.findUnique({ where: { id: userId.trim() } });
}

async function resolveDevUser() {
  return upsertTelegramUser({
    telegramId: DEV_TELEGRAM_ID,
    name: "Local Dev",
    username: "local_dev",
  });
}

export async function requireCurrentUser(request: FastifyRequest) {
  const initData = extractAuthorizationByScheme(request.headers.authorization, "tma");
  if (initData !== null) {
    if (env.BOT_TOKEN.length === 0) {
      throw unauthorized("BOT_TOKEN is not configured");
    }

    const validated = validateTelegramInitData(initData, env.BOT_TOKEN, env.AUTH_MAX_AGE_SECONDS);
    return upsertTelegramUser(validated.user);
  }

  const bearerToken = extractAuthorizationByScheme(request.headers.authorization, "bearer");
  if (bearerToken !== null) {
    const payload = verifySessionToken(bearerToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      throw unauthorized("User not found for auth token");
    }

    return user;
  }

  const userFromHeader = await resolveUserByIdHeader(request);
  if (userFromHeader) {
    return userFromHeader;
  }

  if (env.NODE_ENV !== "production") {
    return resolveDevUser();
  }

  throw unauthorized("Unauthorized request");
}
