import { notFound } from "../../lib/http-error.js";
import { prisma } from "../../services/prisma.js";

export async function ensureClientOwnedByUser(clientId: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      userId,
    },
  });

  if (!client) {
    throw notFound("Client not found");
  }

  return client;
}

export async function ensureTemplateOwnedByUser(templateId: string, userId: string) {
  const template = await prisma.messageTemplate.findFirst({
    where: {
      id: templateId,
      userId,
    },
  });

  if (!template) {
    throw notFound("Template not found");
  }

  return template;
}

export async function ensureTaskOwnedByUser(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      order: true,
    },
  });

  if (!task || task.order.userId !== userId) {
    throw notFound("Task not found");
  }

  return task;
}

export async function ensureReminderOwnedByUser(reminderId: string, userId: string) {
  const reminder = await prisma.reminder.findUnique({
    where: {
      id: reminderId,
    },
    include: {
      order: true,
    },
  });

  if (!reminder || reminder.order.userId !== userId) {
    throw notFound("Reminder not found");
  }

  return reminder;
}
