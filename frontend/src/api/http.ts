const AUTH_TOKEN_STORAGE_KEY = "crm_auth_token";

export class ApiError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const rawText = await response.text();

  if (rawText.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    throw new ApiError("Server returned invalid JSON", response.status);
  }
}

function buildHeaders(base?: HeadersInit): Headers {
  const headers = new Headers(base);
  headers.set("Content-Type", "application/json");

  const authToken = getAuthToken();
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  return headers;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `API request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
