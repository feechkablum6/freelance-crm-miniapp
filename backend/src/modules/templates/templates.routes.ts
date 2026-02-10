import type { FastifyInstance } from "fastify";
import { asNonEmptyString, asRecord } from "../../lib/validation.js";
import { prisma } from "../../services/prisma.js";
import { requireCurrentUser } from "../auth/request-user.js";
import { ensureTemplateOwnedByUser } from "../common/access.js";
import { parseIdParam } from "../common/params.js";

function parseTemplateInput(payload: unknown) {
  const body = asRecord(payload, "body");

  return {
    title: asNonEmptyString(body.title, "title"),
    body: asNonEmptyString(body.body, "body"),
  };
}

function parseTemplatePatch(payload: unknown) {
  const body = asRecord(payload, "body");

  return {
    title: body.title === undefined ? undefined : asNonEmptyString(body.title, "title"),
    body: body.body === undefined ? undefined : asNonEmptyString(body.body, "body"),
  };
}

export async function templatesRoutes(app: FastifyInstance) {
  app.get("/templates", async (request) => {
    const user = await requireCurrentUser(request);

    const items = await prisma.messageTemplate.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { items };
  });

  app.post("/templates", async (request) => {
    const user = await requireCurrentUser(request);
    const data = parseTemplateInput(request.body ?? {});

    const item = await prisma.messageTemplate.create({
      data: {
        userId: user.id,
        title: data.title,
        body: data.body,
      },
    });

    return { item };
  });

  app.patch("/templates/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const templateId = parseIdParam(request.params, "id");
    const patch = parseTemplatePatch(request.body ?? {});

    await ensureTemplateOwnedByUser(templateId, user.id);

    const item = await prisma.messageTemplate.update({
      where: { id: templateId },
      data: {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.body !== undefined ? { body: patch.body } : {}),
      },
    });

    return { item };
  });

  app.delete("/templates/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const templateId = parseIdParam(request.params, "id");

    await ensureTemplateOwnedByUser(templateId, user.id);

    await prisma.messageTemplate.delete({
      where: { id: templateId },
    });

    return { success: true };
  });
}
