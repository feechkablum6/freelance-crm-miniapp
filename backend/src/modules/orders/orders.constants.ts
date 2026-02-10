import { OrderStatus } from "../../generated/prisma/enums.js";

export const ORDER_STATUSES = [
  OrderStatus.NEW,
  OrderStatus.IN_PROGRESS,
  OrderStatus.IN_REVIEW,
  OrderStatus.DONE,
  OrderStatus.ARCHIVED,
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];
export type OrderDeadlineFilter = "overdue" | "today" | "upcoming";
