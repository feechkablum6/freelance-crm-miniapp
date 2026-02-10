import "dotenv/config";

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parseNumberEnv(key: string, fallback: string): number {
  const value = Number(requireEnv(key, fallback));

  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return value;
}

function parseBooleanEnv(key: string, fallback: string): boolean {
  const normalized = requireEnv(key, fallback).toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new Error(`Environment variable ${key} must be 'true' or 'false'`);
}

const defaultAuthTokenSecret = process.env.NODE_ENV === "production" ? undefined : "dev-auth-token-secret";

export const env = {
  NODE_ENV: requireEnv("NODE_ENV", "development"),
  PORT: parseNumberEnv("PORT", "3000"),
  HOST: requireEnv("HOST", "0.0.0.0"),
  DATABASE_URL: requireEnv("DATABASE_URL", "file:./dev.db"),
  BOT_TOKEN: process.env.BOT_TOKEN ?? "",
  AUTH_MAX_AGE_SECONDS: parseNumberEnv("AUTH_MAX_AGE_SECONDS", "86400"),
  AUTH_TOKEN_SECRET: requireEnv("AUTH_TOKEN_SECRET", defaultAuthTokenSecret),
  AUTH_TOKEN_TTL_SECONDS: parseNumberEnv("AUTH_TOKEN_TTL_SECONDS", "604800"),
  DEV_ALLOW_USER_ID_HEADER: parseBooleanEnv("DEV_ALLOW_USER_ID_HEADER", "false"),
} as const;
