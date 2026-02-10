import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { unauthorized } from "../../lib/http-error.js";

type SessionTokenPayload = {
  userId: string;
  iat: number;
  exp: number;
};

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", env.AUTH_TOKEN_SECRET).update(encodedPayload).digest("base64url");
}

function safeCompareValue(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parsePayload(encodedPayload: string): SessionTokenPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(decodeBase64Url(encodedPayload));
  } catch {
    throw unauthorized("Invalid auth token payload");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw unauthorized("Invalid auth token payload");
  }

  const payload = parsed as Record<string, unknown>;
  const userId = payload.userId;
  const iat = payload.iat;
  const exp = payload.exp;

  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw unauthorized("Invalid auth token payload");
  }

  if (typeof iat !== "number" || !Number.isFinite(iat)) {
    throw unauthorized("Invalid auth token payload");
  }

  if (typeof exp !== "number" || !Number.isFinite(exp)) {
    throw unauthorized("Invalid auth token payload");
  }

  return {
    userId,
    iat,
    exp,
  };
}

export function createSessionToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = {
    userId,
    iat: now,
    exp: now + env.AUTH_TOKEN_TTL_SECONDS,
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionTokenPayload {
  const [encodedPayload, signature, extraPart] = token.split(".");

  if (!encodedPayload || !signature || extraPart !== undefined) {
    throw unauthorized("Invalid auth token format");
  }

  const expectedSignature = signPayload(encodedPayload);
  if (!safeCompareValue(signature, expectedSignature)) {
    throw unauthorized("Invalid auth token signature");
  }

  const payload = parsePayload(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw unauthorized("Auth token is expired");
  }

  return payload;
}
