export type OrderStatus = "NEW" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "ARCHIVED";

export interface User {
  id: string;
  telegramId: string;
  name: string;
  username: string | null;
  createdAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  contact: string | null;
  source: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  budget: number;
  status: OrderStatus;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithClient extends Order {
  client: Client;
}

export interface TaskItem {
  id: string;
  orderId: string;
  title: string;
  done: boolean;
  position: number;
}

export interface OrderNote {
  id: string;
  orderId: string;
  text: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  orderId: string;
  remindAt: string;
  sent: boolean;
  channel: string;
  createdAt: string;
  order?: {
    id: string;
    title: string;
  };
}

export interface MessageTemplate {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
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

export interface FullOrder extends OrderWithClient {
  tasks: TaskItem[];
  notes: OrderNote[];
  reminders: Reminder[];
}
