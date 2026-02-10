import { useEffect, useState, type FormEvent } from "react";
import {
  createOrderNote,
  createOrderTask,
  createReminder,
  fetchOrderDetails,
  updateOrderStatus,
  updateTask,
} from "../api";
import { ORDER_STATUS_OPTIONS, getOrderStatusLabel } from "../constants/order-status";
import type { FullOrder, OrderStatus } from "../types/domain";

interface OrderDetailsPageProps {
  orderId: string;
  onBack: () => void;
}

export function OrderDetailsPage({ orderId, onBack }: OrderDetailsPageProps) {
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [reminderAt, setReminderAt] = useState("");

  const loadOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setOrder(await fetchOrderDetails(orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить детали заказа");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  const handleStatusChange = async (status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить статус");
    }
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (taskTitle.trim().length === 0 || !order) {
      return;
    }

    try {
      await createOrderTask(order.id, {
        title: taskTitle,
        position: order.tasks.length,
      });
      setTaskTitle("");
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить задачу");
    }
  };

  const handleToggleTask = async (taskId: string, done: boolean) => {
    try {
      await updateTask(taskId, { done });
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить задачу");
    }
  };

  const handleCreateNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order || noteText.trim().length === 0) {
      return;
    }

    try {
      await createOrderNote(order.id, { text: noteText });
      setNoteText("");
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить заметку");
    }
  };

  const handleCreateReminder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order || reminderAt.trim().length === 0) {
      return;
    }

    try {
      await createReminder({
        orderId: order.id,
        remindAt: new Date(reminderAt).toISOString(),
        sent: false,
      });
      setReminderAt("");
      await loadOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать напоминание");
    }
  };

  if (isLoading) {
    return (
      <section className="page">
        <button className="ghost-btn" onClick={onBack} type="button">
          Назад
        </button>
        <p className="muted">Загрузка заказа...</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="page">
        <button className="ghost-btn" onClick={onBack} type="button">
          Назад
        </button>
        <p className="error-text">{error ?? "Заказ не найден"}</p>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <button className="ghost-btn" onClick={onBack} type="button">
          Назад
        </button>
        <button className="ghost-btn" onClick={() => void loadOrder()} type="button">
          Обновить
        </button>
      </header>

      <section className="block">
        <h1>{order.title}</h1>
        <p className="muted">Клиент: {order.client.name}</p>
        <p className="muted">Бюджет: {order.budget.toLocaleString("ru-RU")} ₽</p>
        <p className="muted">
          Дедлайн: {order.deadline ? new Date(order.deadline).toLocaleString("ru-RU") : "не задан"}
        </p>

        <div className="inline-actions">
          <span className="status-chip">{getOrderStatusLabel(order.status)}</span>
          <select
            value={order.status}
            onChange={(event) => void handleStatusChange(event.target.value as OrderStatus)}
          >
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}

      <section className="block">
        <h2>Чеклист</h2>
        <form className="inline-form" onSubmit={handleCreateTask}>
          <input
            placeholder="Новая задача"
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
          />
          <button className="primary-btn" type="submit">
            Добавить
          </button>
        </form>
        <ul className="plain-list">
          {order.tasks.map((task) => (
            <li className="list-item" key={task.id}>
              <label className="checkbox-line">
                <input
                  checked={task.done}
                  onChange={(event) => void handleToggleTask(task.id, event.target.checked)}
                  type="checkbox"
                />
                <span>{task.title}</span>
              </label>
            </li>
          ))}
          {order.tasks.length === 0 && <li className="muted">Задач пока нет</li>}
        </ul>
      </section>

      <section className="block">
        <h2>Заметки</h2>
        <form className="inline-form" onSubmit={handleCreateNote}>
          <input
            placeholder="Добавить заметку"
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
          />
          <button className="primary-btn" type="submit">
            Сохранить
          </button>
        </form>
        <ul className="plain-list">
          {order.notes.map((note) => (
            <li className="list-item" key={note.id}>
              <div>
                <p>{note.text}</p>
                <time className="muted">{new Date(note.createdAt).toLocaleString("ru-RU")}</time>
              </div>
            </li>
          ))}
          {order.notes.length === 0 && <li className="muted">Заметок пока нет</li>}
        </ul>
      </section>

      <section className="block">
        <h2>Напоминания</h2>
        <form className="inline-form" onSubmit={handleCreateReminder}>
          <input type="datetime-local" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} />
          <button className="primary-btn" type="submit">
            Создать
          </button>
        </form>
        <ul className="plain-list">
          {order.reminders.map((reminder) => (
            <li className="list-item" key={reminder.id}>
              <div>
                <p>{new Date(reminder.remindAt).toLocaleString("ru-RU")}</p>
                <p className="muted">Канал: {reminder.channel}</p>
              </div>
              <span className={reminder.sent ? "status-chip done" : "status-chip"}>
                {reminder.sent ? "Отправлено" : "Не отправлено"}
              </span>
            </li>
          ))}
          {order.reminders.length === 0 && <li className="muted">Напоминаний пока нет</li>}
        </ul>
      </section>
    </section>
  );
}
