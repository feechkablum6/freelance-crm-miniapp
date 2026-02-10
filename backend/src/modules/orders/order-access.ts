import { notFound } from "../../lib/http-error.js";
import { prisma } from "../../services/prisma.js";

export async function ensureOrderOwnedByUser(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
  });

  if (!order) {
    throw notFound("Order not found");
  }

  return order;
}
