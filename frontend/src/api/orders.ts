import type { FullOrder, OrderStatus, OrderWithClient, OrderNote, Reminder, TaskItem } from "../types/domain";
import { apiRequest } from "./http";

export async function fetchOrders(filters: {
  status?: OrderStatus | "";
  search?: string;
  deadline?: "" | "overdue" | "today" | "upcoming";
}): Promise<OrderWithClient[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.search && filters.search.trim().length > 0) {
    params.set("search", filters.search.trim());
  }

  if (filters.deadline) {
    params.set("deadline", filters.deadline);
  }

  const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
  const response = await apiRequest<{ items: OrderWithClient[] }>(`/orders${suffix}`);

  return response.items;
}

export async function createOrder(input: {
  clientId: string;
  title: string;
  budget: number;
  status: OrderStatus;
  deadline: string | null;
}): Promise<OrderWithClient> {
  const response = await apiRequest<{ item: OrderWithClient }>("/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function updateOrder(
  orderId: string,
  input: Partial<{
    clientId: string;
    title: string;
    budget: number;
    status: OrderStatus;
    deadline: string | null;
  }>
): Promise<OrderWithClient> {
  const response = await apiRequest<{ item: OrderWithClient }>(`/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function deleteOrder(orderId: string): Promise<void> {
  await apiRequest<{ success: true }>(`/orders/${orderId}`, {
    method: "DELETE",
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderWithClient> {
  const response = await apiRequest<{ item: OrderWithClient }>(`/orders/${orderId}/status`, {
    method: "POST",
    body: JSON.stringify({
      status,
    }),
  });

  return response.item;
}

export async function fetchOrderDetails(orderId: string): Promise<FullOrder> {
  const response = await apiRequest<{ item: FullOrder }>(`/orders/${orderId}`);
  return response.item;
}

export async function fetchOrderTasks(orderId: string): Promise<TaskItem[]> {
  const response = await apiRequest<{ items: TaskItem[] }>(`/orders/${orderId}/tasks`);
  return response.items;
}

export async function createOrderTask(orderId: string, input: { title: string; position: number }): Promise<TaskItem> {
  const response = await apiRequest<{ item: TaskItem }>(`/orders/${orderId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.item;
}

export async function updateTask(
  taskId: string,
  input: Partial<{ title: string; done: boolean; position: number }>
): Promise<TaskItem> {
  const response = await apiRequest<{ item: TaskItem }>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.item;
}

export async function fetchOrderNotes(orderId: string): Promise<OrderNote[]> {
  const response = await apiRequest<{ items: OrderNote[] }>(`/orders/${orderId}/notes`);
  return response.items;
}

export async function createOrderNote(orderId: string, input: { text: string }): Promise<OrderNote> {
  const response = await apiRequest<{ item: OrderNote }>(`/orders/${orderId}/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.item;
}

export async function createReminder(input: {
  orderId: string;
  remindAt: string;
  sent?: boolean;
  channel?: string;
}): Promise<Reminder> {
  const response = await apiRequest<{ item: Reminder }>("/reminders", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.item;
}
