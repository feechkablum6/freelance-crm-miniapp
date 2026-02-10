import type { FastifyInstance } from "fastify";
import { prisma } from "../services/prisma.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, _reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      };
    } catch {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
      };
    }
  });
}
