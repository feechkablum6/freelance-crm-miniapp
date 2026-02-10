import type { FastifyInstance } from "fastify";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { clientsRoutes } from "../modules/clients/clients.routes.js";
import { dashboardRoutes } from "../modules/dashboard/dashboard.routes.js";
import { orderDetailsRoutes } from "../modules/orders/order-details.routes.js";
import { ordersRoutes } from "../modules/orders/orders.routes.js";
import { remindersRoutes } from "../modules/reminders/reminders.routes.js";
import { templatesRoutes } from "../modules/templates/templates.routes.js";
import { healthRoutes } from "./health.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes);
  await app.register(dashboardRoutes);
  await app.register(clientsRoutes);
  await app.register(ordersRoutes);
  await app.register(orderDetailsRoutes);
  await app.register(templatesRoutes);
  await app.register(remindersRoutes);
  await app.register(healthRoutes);
}
