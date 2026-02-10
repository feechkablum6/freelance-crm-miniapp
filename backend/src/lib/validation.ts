import { badRequest } from "./http-error.js";

export function asRecord(value: unknown, field = "body"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw badRequest(`Field '${field}' must be an object`);
  }

  return value as Record<string, unknown>;
}

export function asString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw badRequest(`Field '${field}' must be a string`);
  }

  return value;
}

export function asNonEmptyString(value: unknown, field: string): string {
  const parsed = asString(value, field).trim();

  if (parsed.length === 0) {
    throw badRequest(`Field '${field}' cannot be empty`);
  }

  return parsed;
}

export function asOptionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return asString(value, field).trim();
}

export function asNumber(value: unknown, field: string): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw badRequest(`Field '${field}' must be a valid number`);
}

export function asOptionalNumber(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return asNumber(value, field);
}

export function asBoolean(value: unknown, field: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  throw badRequest(`Field '${field}' must be a boolean`);
}

export function asOptionalBoolean(value: unknown, field: string): boolean | null {
  if (value === undefined || value === null) {
    return null;
  }

  return asBoolean(value, field);
}

export function asDate(value: unknown, field: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw badRequest(`Field '${field}' must be a valid datetime`);
    }
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  throw badRequest(`Field '${field}' must be a valid datetime`);
}

export function asOptionalDate(value: unknown, field: string): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return asDate(value, field);
}

export function asEnumValue<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[]
): T {
  const parsed = asString(value, field);

  if (!allowed.includes(parsed as T)) {
    throw badRequest(`Field '${field}' has invalid value`);
  }

  return parsed as T;
}
