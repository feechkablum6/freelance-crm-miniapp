import { badRequest } from "../../lib/http-error.js";
import {
  asEnumValue,
  asNonEmptyString,
  asOptionalDate,
  asOptionalNumber,
  asRecord,
} from "../../lib/validation.js";
import { OrderStatus } from "../../generated/prisma/enums.js";
import { ORDER_STATUSES, type OrderDeadlineFilter, type OrderStatusValue } from "./orders.constants.js";

export type ParsedOrderInput = {
  clientId: string;
  title: string;
  budget: number;
  status: OrderStatusValue;
  deadline: Date | null;
};

export type ParsedOrderPatch = {
  clientId: string | undefined;
  title: string | undefined;
  budget: number | undefined;
  status: OrderStatusValue | undefined;
  deadline: Date | null | undefined;
};

export type ParsedStatusPatch = {
  status: OrderStatusValue;
};

export type ParsedOrdersQuery = {
  status: OrderStatusValue | null;
  search: string | null;
  deadlineFilter: OrderDeadlineFilter | null;
};

export function parseOrderInput(payload: unknown): ParsedOrderInput {
  const body = asRecord(payload, "body");

  const status =
    body.status === undefined ? OrderStatus.NEW : asEnumValue(body.status, "status", ORDER_STATUSES);

  return {
    clientId: asNonEmptyString(body.clientId, "clientId"),
    title: asNonEmptyString(body.title, "title"),
    budget: asOptionalNumber(body.budget, "budget") ?? 0,
    status,
    deadline: asOptionalDate(body.deadline, "deadline"),
  };
}

export function parseOrderPatch(payload: unknown): ParsedOrderPatch {
  const body = asRecord(payload, "body");

  const status =
    body.status === undefined ? undefined : asEnumValue(body.status, "status", ORDER_STATUSES);

  return {
    clientId: body.clientId === undefined ? undefined : asNonEmptyString(body.clientId, "clientId"),
    title: body.title === undefined ? undefined : asNonEmptyString(body.title, "title"),
    budget: body.budget === undefined ? undefined : asOptionalNumber(body.budget, "budget") ?? 0,
    status,
    deadline: body.deadline === undefined ? undefined : asOptionalDate(body.deadline, "deadline"),
  };
}

export function parseStatusPatch(payload: unknown): ParsedStatusPatch {
  const body = asRecord(payload, "body");

  return {
    status: asEnumValue(body.status, "status", ORDER_STATUSES),
  };
}

export function parseOrdersQuery(query: unknown): ParsedOrdersQuery {
  const record = asRecord(query, "query");

  const statusValue = record.status;
  const searchValue = record.search;
  const deadlineValue = record.deadline;

  let status: OrderStatusValue | null = null;
  if (statusValue !== undefined && statusValue !== "") {
    status = asEnumValue(statusValue, "status", ORDER_STATUSES);
  }

  let search: string | null = null;
  if (typeof searchValue === "string" && searchValue.trim().length > 0) {
    search = searchValue.trim();
  }

  let deadlineFilter: OrderDeadlineFilter | null = null;
  if (deadlineValue !== undefined && deadlineValue !== "") {
    if (deadlineValue !== "overdue" && deadlineValue !== "today" && deadlineValue !== "upcoming") {
      throw badRequest("Query parameter 'deadline' has invalid value");
    }
    deadlineFilter = deadlineValue;
  }

  return {
    status,
    search,
    deadlineFilter,
  };
}
