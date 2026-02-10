import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config/index.js";
import { HttpError } from "./lib/http-error.js";
import { registerRoutes } from "./routes/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.logger.level,
    },
  });

  await app.register(cors, config.cors);
  await registerRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      request.log.warn({ err: error }, error.message);
      reply.status(error.statusCode).send({
        error: error.message,
      });
      return;
    }

    request.log.error({ err: error }, "Unhandled error");
    reply.status(500).send({
      error: "Internal server error",
    });
  });

  return app;
}
