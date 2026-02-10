export interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  database: "connected" | "disconnected";
}

export interface DashboardSummary {
  activeOrders: number;
  overdueOrders: number;
  monthlyIncome: number;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    deadline: string;
    clientName: string;
  }>;
}
