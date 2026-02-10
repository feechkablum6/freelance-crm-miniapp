import type { FastifyInstance } from "fastify";
import { notFound } from "../../lib/http-error.js";
import { prisma } from "../../services/prisma.js";
import { requireCurrentUser } from "../auth/request-user.js";
import { ensureClientOwnedByUser } from "../common/access.js";
import { parseIdParam } from "../common/params.js";
import { ensureOrderOwnedByUser } from "./order-access.js";
import { buildOrderPatchData, buildOrdersWhere, applyDeadlineFilter } from "./orders.query.js";
import {
  parseOrderInput,
  parseOrderPatch,
  parseOrdersQuery,
  parseStatusPatch,
} from "./orders.validation.js";

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  app.get("/orders", async (request) => {
    const user = await requireCurrentUser(request);
    const query = parseOrdersQuery(request.query ?? {});

    const baseWhere = buildOrdersWhere(user.id, query);
    const where = applyDeadlineFilter(baseWhere, query.deadlineFilter);

    const items = await prisma.order.findMany({
      where,
      include: {
        client: true,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return { items };
  });

  app.post("/orders", async (request) => {
    const user = await requireCurrentUser(request);
    const data = parseOrderInput(request.body ?? {});

    await ensureClientOwnedByUser(data.clientId, user.id);

    const item = await prisma.order.create({
      data: {
        userId: user.id,
        clientId: data.clientId,
        title: data.title,
        budget: data.budget,
        status: data.status,
        deadline: data.deadline,
      },
      include: {
        client: true,
      },
    });

    return { item };
  });

  app.get("/orders/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const orderId = parseIdParam(request.params, "id");

    await ensureOrderOwnedByUser(orderId, user.id);

    const item = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        tasks: {
          orderBy: { position: "asc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
        },
        reminders: {
          orderBy: { remindAt: "asc" },
        },
      },
    });

    if (!item) {
      throw notFound("Order not found");
    }

    return { item };
  });

  app.patch("/orders/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const orderId = parseIdParam(request.params, "id");
    const patch = parseOrderPatch(request.body ?? {});

    await ensureOrderOwnedByUser(orderId, user.id);

    if (patch.clientId !== undefined) {
      await ensureClientOwnedByUser(patch.clientId, user.id);
    }

    const item = await prisma.order.update({
      where: { id: orderId },
      data: buildOrderPatchData(patch),
      include: {
        client: true,
      },
    });

    return { item };
  });

  app.delete("/orders/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const orderId = parseIdParam(request.params, "id");

    await ensureOrderOwnedByUser(orderId, user.id);
    await prisma.order.delete({ where: { id: orderId } });

    return { success: true };
  });

  app.post("/orders/:id/status", async (request) => {
    const user = await requireCurrentUser(request);
    const orderId = parseIdParam(request.params, "id");
    const data = parseStatusPatch(request.body ?? {});

    await ensureOrderOwnedByUser(orderId, user.id);

    const item = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: data.status,
      },
      include: {
        client: true,
      },
    });

    return { item };
  });
}
