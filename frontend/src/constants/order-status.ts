import type { OrderStatus } from "../types/domain";

export const ORDER_STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "NEW", label: "Новый" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "IN_REVIEW", label: "На проверке" },
  { value: "DONE", label: "Готово" },
  { value: "ARCHIVED", label: "Архив" },
];

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}
