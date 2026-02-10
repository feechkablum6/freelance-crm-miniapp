import { env } from "./env.js";

export const config = {
  port: env.PORT,
  host: env.HOST,
  cors: {
    origin: true,
  },
  logger: {
    level: "info",
  },
} as const;
