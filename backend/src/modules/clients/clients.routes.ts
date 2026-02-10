import type { FastifyInstance } from "fastify";
import { asNonEmptyString, asOptionalString, asRecord } from "../../lib/validation.js";
import { prisma } from "../../services/prisma.js";
import { requireCurrentUser } from "../auth/request-user.js";
import { ensureClientOwnedByUser } from "../common/access.js";
import { parseIdParam } from "../common/params.js";

function parseClientInput(payload: unknown) {
  const body = asRecord(payload, "body");

  return {
    name: asNonEmptyString(body.name, "name"),
    contact: asOptionalString(body.contact, "contact"),
    source: asOptionalString(body.source, "source"),
  };
}

function parseClientPatch(payload: unknown) {
  const body = asRecord(payload, "body");

  return {
    name: body.name === undefined ? undefined : asNonEmptyString(body.name, "name"),
    contact: body.contact === undefined ? undefined : asOptionalString(body.contact, "contact"),
    source: body.source === undefined ? undefined : asOptionalString(body.source, "source"),
  };
}

export async function clientsRoutes(app: FastifyInstance) {
  app.get("/clients", async (request) => {
    const user = await requireCurrentUser(request);

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return { items: clients };
  });

  app.post("/clients", async (request) => {
    const user = await requireCurrentUser(request);
    const data = parseClientInput(request.body ?? {});

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name: data.name,
        contact: data.contact,
        source: data.source,
      },
    });

    return { item: client };
  });

  app.patch("/clients/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const clientId = parseIdParam(request.params, "id");
    const patch = parseClientPatch(request.body ?? {});

    await ensureClientOwnedByUser(clientId, user.id);

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.contact !== undefined ? { contact: patch.contact } : {}),
        ...(patch.source !== undefined ? { source: patch.source } : {}),
      },
    });

    return { item: updated };
  });

  app.delete("/clients/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const clientId = parseIdParam(request.params, "id");

    await ensureClientOwnedByUser(clientId, user.id);

    await prisma.client.delete({ where: { id: clientId } });

    return { success: true };
  });
}
