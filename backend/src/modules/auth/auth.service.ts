import { prisma } from "../../services/prisma.js";
import type { TelegramAuthUser } from "./types.js";

export interface PublicUser {
  id: string;
  telegramId: string;
  name: string;
  username: string | null;
  createdAt: string;
}

export async function upsertTelegramUser(data: TelegramAuthUser) {
  return prisma.user.upsert({
    where: {
      telegramId: data.telegramId,
    },
    create: {
      telegramId: data.telegramId,
      name: data.name,
      username: data.username,
    },
    update: {
      name: data.name,
      username: data.username,
    },
  });
}

export function toPublicUser(user: {
  id: string;
  telegramId: bigint;
  name: string;
  username: string | null;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    telegramId: user.telegramId.toString(),
    name: user.name,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
  };
}
