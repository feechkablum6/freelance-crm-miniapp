import type { FastifyInstance } from "fastify";
import { OrderStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../services/prisma.js";
import { requireCurrentUser } from "../auth/request-user.js";

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);

  return { start, end };
}

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard/summary", async (request) => {
    const user = await requireCurrentUser(request);
    const now = new Date();
    const { start, end } = getMonthRange(now);

    const [activeOrders, overdueOrders, monthlyIncomeResult, upcomingDeadlines] = await Promise.all([
      prisma.order.count({
        where: {
          userId: user.id,
          status: {
            in: [OrderStatus.NEW, OrderStatus.IN_PROGRESS, OrderStatus.IN_REVIEW],
          },
        },
      }),
      prisma.order.count({
        where: {
          userId: user.id,
          status: {
            in: [OrderStatus.NEW, OrderStatus.IN_PROGRESS, OrderStatus.IN_REVIEW],
          },
          deadline: {
            lt: now,
          },
        },
      }),
      prisma.order.aggregate({
        _sum: {
          budget: true,
        },
        where: {
          userId: user.id,
          status: OrderStatus.DONE,
          updatedAt: {
            gte: start,
            lt: end,
          },
        },
      }),
      prisma.order.findMany({
        where: {
          userId: user.id,
          status: {
            in: [OrderStatus.NEW, OrderStatus.IN_PROGRESS, OrderStatus.IN_REVIEW],
          },
          deadline: {
            gte: now,
          },
        },
        include: {
          client: true,
        },
        orderBy: {
          deadline: "asc",
        },
        take: 5,
      }),
    ]);

    return {
      activeOrders,
      overdueOrders,
      monthlyIncome: monthlyIncomeResult._sum.budget ?? 0,
      upcomingDeadlines: upcomingDeadlines
        .filter((item) => item.deadline !== null)
        .map((item) => ({
          id: item.id,
          title: item.title,
          deadline: item.deadline?.toISOString() ?? "",
          clientName: item.client.name,
        })),
    };
  });
}
