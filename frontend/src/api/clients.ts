import type { Client } from "../types/domain";
import { apiRequest } from "./http";

export async function fetchClients(): Promise<Client[]> {
  const response = await apiRequest<{ items: Client[] }>("/clients");
  return response.items;
}

export async function createClient(input: {
  name: string;
  contact: string;
  source: string;
}): Promise<Client> {
  const response = await apiRequest<{ item: Client }>("/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.item;
}

export async function updateClient(
  clientId: string,
  input: Partial<{ name: string; contact: string; source: string }>
): Promise<Client> {
  const response = await apiRequest<{ item: Client }>(`/clients/${clientId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.item;
}

export async function deleteClient(clientId: string): Promise<void> {
  await apiRequest<{ success: true }>(`/clients/${clientId}`, {
    method: "DELETE",
  });
}
