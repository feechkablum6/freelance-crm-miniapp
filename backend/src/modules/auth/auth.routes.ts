import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { badRequest } from "../../lib/http-error.js";
import { asNonEmptyString, asNumber, asOptionalString, asRecord } from "../../lib/validation.js";
import { toPublicUser, upsertTelegramUser } from "./auth.service.js";
import { requireCurrentUser } from "./request-user.js";
import { createSessionToken } from "./session-token.js";
import { validateTelegramInitData } from "./telegram-verify.js";

function parseDevUser(data: unknown) {
  const record = asRecord(data, "devUser");

  return {
    telegramId: BigInt(asNumber(record.telegramId, "devUser.telegramId")),
    name: asNonEmptyString(record.name, "devUser.name"),
    username: asOptionalString(record.username, "devUser.username"),
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/telegram", async (request) => {
    const body = asRecord(request.body ?? {}, "body");
    const initData = body.initData;

    if (typeof initData === "string" && initData.trim().length > 0) {
      if (env.BOT_TOKEN.length === 0) {
        throw badRequest("BOT_TOKEN is not configured for Telegram auth");
      }

      const validated = validateTelegramInitData(initData, env.BOT_TOKEN, env.AUTH_MAX_AGE_SECONDS);
      const user = await upsertTelegramUser(validated.user);

      return {
        mode: "telegram",
        user: toPublicUser(user),
        token: createSessionToken(user.id),
      };
    }

    if (env.NODE_ENV !== "production" && body.devUser !== undefined) {
      const devUser = parseDevUser(body.devUser);
      const user = await upsertTelegramUser(devUser);

      return {
        mode: "dev",
        user: toPublicUser(user),
        token: createSessionToken(user.id),
      };
    }

    throw badRequest("Provide 'initData' for Telegram auth");
  });

  app.get("/auth/me", async (request) => {
    const user = await requireCurrentUser(request);

    return {
      user: toPublicUser(user),
    };
  });
}
