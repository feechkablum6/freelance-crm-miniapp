import { useEffect, useState, type FormEvent, type JSX } from "react";
import { createOrder, deleteOrder, fetchClients, fetchOrders, updateOrderStatus } from "../api";
import { ORDER_STATUS_OPTIONS, getOrderStatusLabel } from "../constants/order-status";
import type { Client, OrderStatus, OrderWithClient } from "../types/domain";

interface OrdersPageProps {
  onOpenDetails: (orderId: string) => void;
}

interface CreateOrderForm {
  title: string;
  clientId: string;
  budget: string;
  status: OrderStatus;
  deadline: string;
}

type DeadlineFilter = "" | "overdue" | "today" | "upcoming";

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function toDeadlineIso(deadlineValue: string): string | null {
  if (deadlineValue.trim().length === 0) {
    return null;
  }

  return new Date(deadlineValue).toISOString();
}

const EMPTY_ORDER_FORM: CreateOrderForm = {
  title: "",
  clientId: "",
  budget: "0",
  status: "NEW",
  deadline: "",
};

export function OrdersPage({ onOpenDetails }: OrdersPageProps): JSX.Element {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<OrderWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("");
  const [form, setForm] = useState<CreateOrderForm>(EMPTY_ORDER_FORM);

  async function loadClients(): Promise<void> {
    const data = await fetchClients();
    setClients(data);
    if (data.length > 0) {
      setForm((prev) => ({
        ...prev,
        clientId: prev.clientId || data[0].id,
      }));
    }
  }

  async function loadOrders(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchOrders({
        search,
        status: statusFilter,
        deadline: deadlineFilter,
      });
      setOrders(data);
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось загрузить заказы"));
    } finally {
      setIsLoading(false);
    }
  }

  function updateFormField<Key extends keyof CreateOrderForm>(
    key: Key,
    value: CreateOrderForm[Key]
  ): void {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function executeOrderMutation(action: () => Promise<void>, fallbackMessage: string): Promise<void> {
    try {
      await action();
      await loadOrders();
    } catch (err) {
      setError(getErrorMessage(err, fallbackMessage));
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [statusFilter, deadlineFilter]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await loadOrders();
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    await executeOrderMutation(async () => {
      await createOrder({
        clientId: form.clientId,
        title: form.title,
        budget: Number(form.budget),
        status: form.status,
        deadline: toDeadlineIso(form.deadline),
      });

      setForm((prev) => ({
        ...EMPTY_ORDER_FORM,
        clientId: prev.clientId,
      }));
    }, "Не удалось создать заказ");
  }

  async function handleStatusChange(orderId: string, status: OrderStatus): Promise<void> {
    await executeOrderMutation(async () => {
      await updateOrderStatus(orderId, status);
    }, "Не удалось обновить статус");
  }

  async function handleDelete(orderId: string): Promise<void> {
    await executeOrderMutation(async () => {
      await deleteOrder(orderId);
    }, "Не удалось удалить заказ");
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Заказы</h1>
        <button className="ghost-btn" onClick={() => void loadOrders()} type="button">
          Обновить
        </button>
      </header>

      <form className="search-row" onSubmit={handleSearchSubmit}>
        <input
          placeholder="Поиск по названию"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "")}>
          <option value="">Все статусы</option>
          {ORDER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={deadlineFilter}
          onChange={(event) => setDeadlineFilter(event.target.value as DeadlineFilter)}
        >
          <option value="">Все дедлайны</option>
          <option value="overdue">Просроченные</option>
          <option value="today">Сегодня</option>
          <option value="upcoming">Предстоящие</option>
        </select>
        <button className="primary-btn" type="submit">
          Применить
        </button>
      </form>

      <form className="form-grid" onSubmit={handleCreateOrder}>
        <input
          placeholder="Название заказа"
          required
          value={form.title}
          onChange={(event) => updateFormField("title", event.target.value)}
        />
        <select
          required
          value={form.clientId}
          onChange={(event) => updateFormField("clientId", event.target.value)}
        >
          {clients.length === 0 && <option value="">Сначала добавьте клиента</option>}
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <input
          min={0}
          placeholder="Бюджет"
          type="number"
          value={form.budget}
          onChange={(event) => updateFormField("budget", event.target.value)}
        />
        <select
          value={form.status}
          onChange={(event) => updateFormField("status", event.target.value as OrderStatus)}
        >
          {ORDER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={form.deadline}
          onChange={(event) => updateFormField("deadline", event.target.value)}
        />
        <button className="primary-btn" disabled={clients.length === 0} type="submit">
          Создать заказ
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {isLoading && <p className="muted">Загрузка заказов...</p>}

      {!isLoading && (
        <ul className="plain-list">
          {orders.map((order) => (
            <li className="list-item" key={order.id}>
              <div>
                <strong>{order.title}</strong>
                <p className="muted">Клиент: {order.client.name}</p>
                <p className="muted">Бюджет: {order.budget.toLocaleString("ru-RU")} ₽</p>
                <p className="muted">
                  Дедлайн: {order.deadline ? new Date(order.deadline).toLocaleString("ru-RU") : "не задан"}
                </p>
                <p className="status-chip">{getOrderStatusLabel(order.status)}</p>
              </div>
              <div className="stack-actions">
                <select
                  value={order.status}
                  onChange={(event) => void handleStatusChange(order.id, event.target.value as OrderStatus)}
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button className="ghost-btn" onClick={() => onOpenDetails(order.id)} type="button">
                  Открыть
                </button>
                <button className="danger-btn" onClick={() => void handleDelete(order.id)} type="button">
                  Удалить
                </button>
              </div>
            </li>
          ))}
          {orders.length === 0 && <li className="muted">Заказов пока нет</li>}
        </ul>
      )}
    </section>
  );
}
