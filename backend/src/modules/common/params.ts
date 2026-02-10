import { asNonEmptyString, asRecord } from "../../lib/validation.js";

export function parseIdParam(params: unknown, key: string): string {
  const record = asRecord(params, "params");
  return asNonEmptyString(record[key], `params.${key}`);
}
