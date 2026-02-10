import type { MessageTemplate } from "../types/domain";
import { apiRequest } from "./http";

export async function fetchTemplates(): Promise<MessageTemplate[]> {
  const response = await apiRequest<{ items: MessageTemplate[] }>("/templates");
  return response.items;
}

export async function createTemplate(input: { title: string; body: string }): Promise<MessageTemplate> {
  const response = await apiRequest<{ item: MessageTemplate }>("/templates", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function updateTemplate(
  templateId: string,
  input: Partial<{ title: string; body: string }>
): Promise<MessageTemplate> {
  const response = await apiRequest<{ item: MessageTemplate }>(`/templates/${templateId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await apiRequest<{ success: true }>(`/templates/${templateId}`, {
    method: "DELETE",
  });
}
