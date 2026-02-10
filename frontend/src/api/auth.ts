import type { User } from "../types/domain";
import { apiRequest } from "./http";

interface AuthResponse {
  mode: "telegram" | "dev";
  user: User;
  token: string;
}

export async function authWithTelegram(initData: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/telegram", {
    method: "POST",
    body: JSON.stringify({
      initData,
    }),
  });
}

export async function authDev(input: {
  telegramId: number;
  name: string;
  username: string | null;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/telegram", {
    method: "POST",
    body: JSON.stringify({
      devUser: {
        telegramId: input.telegramId,
        name: input.name,
        username: input.username,
      },
    }),
  });
}

export async function getMe(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>("/auth/me");
}
