import type { Reminder } from "../types/domain";
import { apiRequest } from "./http";

export async function fetchReminders(): Promise<Reminder[]> {
  const response = await apiRequest<{ items: Reminder[] }>("/reminders");
  return response.items;
}

export async function updateReminder(
  reminderId: string,
  input: Partial<{ remindAt: string; sent: boolean; channel: string }>
): Promise<Reminder> {
  const response = await apiRequest<{ item: Reminder }>(`/reminders/${reminderId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function deleteReminder(reminderId: string): Promise<void> {
  await apiRequest<{ success: true }>(`/reminders/${reminderId}`, {
    method: "DELETE",
  });
}
