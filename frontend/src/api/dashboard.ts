import type { DashboardSummary } from "../types/domain";
import { apiRequest } from "./http";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>("/dashboard/summary");
}
