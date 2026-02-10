import { createHmac, timingSafeEqual } from "node:crypto";
import { unauthorized } from "../../lib/http-error.js";
import type { ValidatedInitData } from "./types.js";

function parseTelegramUser(rawUser: string): ValidatedInitData["user"] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawUser);
  } catch {
    throw unauthorized("Invalid Telegram user payload");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw unauthorized("Invalid Telegram user payload");
  }

  const user = parsed as Record<string, unknown>;
  const id = user.id;
  const firstName = user.first_name;
  const lastName = user.last_name;
  const username = user.username;

  if (typeof id !== "number" || !Number.isInteger(id)) {
    throw unauthorized("Telegram user id is missing");
  }

  if (typeof firstName !== "string" || firstName.trim().length === 0) {
    throw unauthorized("Telegram user first_name is missing");
  }

  const fullName = `${firstName} ${typeof lastName === "string" ? lastName : ""}`.trim();

  return {
    telegramId: BigInt(id),
    name: fullName,
    username: typeof username === "string" && username.trim().length > 0 ? username : null,
  };
}

function safeCompareHex(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, "hex");
    const rightBuffer = Buffer.from(right, "hex");

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

export function validateTelegramInitData(
  initDataRaw: string,
  botToken: string,
  maxAgeSeconds: number
): ValidatedInitData {
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get("hash");

  if (!hash) {
    throw unauthorized("Missing Telegram hash");
  }

  const keyValuePairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") {
      continue;
    }

    keyValuePairs.push(`${key}=${value}`);
  }

  keyValuePairs.sort((a, b) => a.localeCompare(b));
  const dataCheckString = keyValuePairs.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!safeCompareHex(calculatedHash, hash)) {
    throw unauthorized("Invalid Telegram signature");
  }

  const authDateValue = params.get("auth_date");
  if (!authDateValue) {
    throw unauthorized("Missing Telegram auth_date");
  }

  const authDate = Number(authDateValue);
  if (!Number.isFinite(authDate)) {
    throw unauthorized("Invalid Telegram auth_date");
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - authDate) > maxAgeSeconds) {
    throw unauthorized("Telegram auth data is expired");
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    throw unauthorized("Missing Telegram user data");
  }

  return {
    authDate,
    user: parseTelegramUser(userRaw),
  };
}
