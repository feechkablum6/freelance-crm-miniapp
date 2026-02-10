import type { FastifyInstance } from "fastify";
import { asNonEmptyString, asOptionalBoolean, asOptionalNumber, asRecord } from "../../lib/validation.js";
import { prisma } from "../../services/prisma.js";
import { requireCurrentUser } from "../auth/request-user.js";
import { ensureTaskOwnedByUser } from "../common/access.js";
import { parseIdParam } from "../common/params.js";
import { ensureOrderOwnedByUser } from "./order-access.js";

function parseTaskInput(payload: unknown) {
  const body = asRecord(payload, "body");

  return {
    title: asNonEmptyString(body.title, "title"),
    position: asOptionalNumber(body.position, "position") ?? 0,
  };
}

function parseTaskPatch(payload: unknown) {
  const body = asRecord(payload, "body");

  return {
    title: body.title === undefined ? undefined : asNonEmptyString(body.title, "title"),
    done: body.done === undefined ? undefined : asOptionalBoolean(body.done, "done") ?? false,
    position: body.position === undefined ? undefined : asOptionalNumber(body.position, "position") ?? 0,
  };
}

function parseNoteInput(payload: unknown) {
  const body = asRecord(payload, "body");

  return {
    text: asNonEmptyString(body.text, "text"),
  };
}

export async function orderDetailsRoutes(app: FastifyInstance) {
  app.get("/orders/:id/tasks", async (request) => {
    const user = await requireCurrentUser(request);
    const orderId = parseIdParam(request.params, "id");

    await ensureOrderOwnedByUser(orderId, user.id);

    const items = await prisma.task.findMany({
      where: { orderId },
      orderBy: [
        { position: "asc" },
        { id: "asc" },
      ],
    });

    return { items };
  });

  app.post("/orders/:id/tasks", async (request) => {
    const user = await requireCurrentUser(request);
    const orderId = parseIdParam(request.params, "id");
    const data = parseTaskInput(request.body ?? {});

    await ensureOrderOwnedByUser(orderId, user.id);

    const item = await prisma.task.create({
      data: {
        orderId,
        title: data.title,
        position: data.position,
      },
    });

    return { item };
  });

  app.patch("/tasks/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const taskId = parseIdParam(request.params, "id");
    const patch = parseTaskPatch(request.body ?? {});

    await ensureTaskOwnedByUser(taskId, user.id);

    const item = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.done !== undefined ? { done: patch.done } : {}),
        ...(patch.position !== undefined ? { position: patch.position } : {}),
      },
    });

    return { item };
  });

  app.get("/orders/:id/notes", async (request) => {
    const user = await requireCurrentUser(request);
    const orderId = parseIdParam(request.params, "id");

    await ensureOrderOwnedByUser(orderId, user.id);

    const items = await prisma.orderNote.findMany({
      where: { orderId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { items };
  });

  app.post("/orders/:id/notes", async (request) => {
    const user = await requireCurrentUser(request);
    const orderId = parseIdParam(request.params, "id");
    const data = parseNoteInput(request.body ?? {});

    await ensureOrderOwnedByUser(orderId, user.id);

    const item = await prisma.orderNote.create({
      data: {
        orderId,
        text: data.text,
      },
    });

    return { item };
  });
}
