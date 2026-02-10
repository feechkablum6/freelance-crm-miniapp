import type { FastifyInstance } from "fastify";
import { badRequest } from "../../lib/http-error.js";
import {
  asDate,
  asNonEmptyString,
  asOptionalBoolean,
  asOptionalString,
  asRecord,
} from "../../lib/validation.js";
import { prisma } from "../../services/prisma.js";
import { requireCurrentUser } from "../auth/request-user.js";
import { ensureReminderOwnedByUser } from "../common/access.js";
import { parseIdParam } from "../common/params.js";
import { ensureOrderOwnedByUser } from "../orders/order-access.js";

function parseReminderInput(payload: unknown) {
  const body = asRecord(payload, "body");

  return {
    orderId: asNonEmptyString(body.orderId, "orderId"),
    remindAt: asDate(body.remindAt, "remindAt"),
    sent: asOptionalBoolean(body.sent, "sent") ?? false,
    channel: asOptionalString(body.channel, "channel") ?? "TELEGRAM",
  };
}

function parseReminderPatch(payload: unknown) {
  const body = asRecord(payload, "body");

  let remindAt: Date | undefined;
  if (body.remindAt !== undefined) {
    if (body.remindAt === null || body.remindAt === "") {
      throw badRequest("Field 'remindAt' cannot be null");
    }
    remindAt = asDate(body.remindAt, "remindAt");
  }

  return {
    remindAt,
    sent: body.sent === undefined ? undefined : asOptionalBoolean(body.sent, "sent") ?? false,
    channel: body.channel === undefined ? undefined : asOptionalString(body.channel, "channel") ?? "TELEGRAM",
  };
}

export async function remindersRoutes(app: FastifyInstance) {
  app.get("/reminders", async (request) => {
    const user = await requireCurrentUser(request);

    const items = await prisma.reminder.findMany({
      where: {
        order: {
          userId: user.id,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        remindAt: "asc",
      },
    });

    return { items };
  });

  app.post("/reminders", async (request) => {
    const user = await requireCurrentUser(request);
    const data = parseReminderInput(request.body ?? {});

    await ensureOrderOwnedByUser(data.orderId, user.id);

    const item = await prisma.reminder.create({
      data: {
        orderId: data.orderId,
        remindAt: data.remindAt,
        sent: data.sent,
        channel: data.channel,
      },
      include: {
        order: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return { item };
  });

  app.patch("/reminders/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const reminderId = parseIdParam(request.params, "id");
    const patch = parseReminderPatch(request.body ?? {});

    await ensureReminderOwnedByUser(reminderId, user.id);

    const item = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        ...(patch.remindAt !== undefined ? { remindAt: patch.remindAt } : {}),
        ...(patch.sent !== undefined ? { sent: patch.sent } : {}),
        ...(patch.channel !== undefined ? { channel: patch.channel } : {}),
      },
      include: {
        order: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return { item };
  });

  app.delete("/reminders/:id", async (request) => {
    const user = await requireCurrentUser(request);
    const reminderId = parseIdParam(request.params, "id");

    await ensureReminderOwnedByUser(reminderId, user.id);

    await prisma.reminder.delete({ where: { id: reminderId } });

    return { success: true };
  });
}
