import { OrderStatus } from "../../generated/prisma/enums.js";
import type {
  ParsedOrderPatch,
  ParsedOrdersQuery,
} from "./orders.validation.js";

export function applyDeadlineFilter(
  where: Record<string, unknown>,
  deadlineFilter: ParsedOrdersQuery["deadlineFilter"]
): Record<string, unknown> {
  if (!deadlineFilter) {
    return where;
  }

  const now = new Date();

  switch (deadlineFilter) {
    case "overdue":
      return {
        ...where,
        deadline: {
          lt: now,
        },
        status: {
          in: [OrderStatus.NEW, OrderStatus.IN_PROGRESS, OrderStatus.IN_REVIEW],
        },
      };
    case "upcoming":
      return {
        ...where,
        deadline: {
          gte: now,
        },
      };
    case "today": {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      return {
        ...where,
        deadline: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    }
    default:
      return where;
  }
}

export function buildOrdersWhere(userId: string, query: ParsedOrdersQuery): Record<string, unknown> {
  const where: Record<string, unknown> = {
    userId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.title = {
      contains: query.search,
    };
  }

  return where;
}

export function buildOrderPatchData(patch: ParsedOrderPatch): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (patch.clientId !== undefined) {
    data.clientId = patch.clientId;
  }
  if (patch.title !== undefined) {
    data.title = patch.title;
  }
  if (patch.budget !== undefined) {
    data.budget = patch.budget;
  }
  if (patch.status !== undefined) {
    data.status = patch.status;
  }
  if (patch.deadline !== undefined) {
    data.deadline = patch.deadline;
  }

  return data;
}
