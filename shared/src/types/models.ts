export interface User {
  id: string;
  telegramId: number;
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
  status: string;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
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

export interface MessageTemplate {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  orderId: string;
  remindAt: string;
  sent: boolean;
  channel: string;
  createdAt: string;
}
