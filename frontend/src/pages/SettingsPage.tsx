import { useEffect, useState } from "react";
import { deleteReminder, fetchReminders, updateReminder } from "../api";
import type { Reminder, User } from "../types/domain";

interface SettingsPageProps {
  user: User;
}

const APP_VERSION = "0.1.0-mvp";

export function SettingsPage({ user }: SettingsPageProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReminders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setReminders(await fetchReminders());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить напоминания");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReminders();
  }, []);

  const handleToggleSent = async (reminder: Reminder) => {
    try {
      await updateReminder(reminder.id, {
        sent: !reminder.sent,
      });
      await loadReminders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить статус напоминания");
    }
  };

  const handleDelete = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId);
      await loadReminders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить напоминание");
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h1>Настройки</h1>
        <button className="ghost-btn" onClick={() => void loadReminders()} type="button">
          Обновить
        </button>
      </header>

      <section className="block">
        <h2>Профиль Telegram</h2>
        <p>
          <strong>Имя:</strong> {user.name}
        </p>
        <p>
          <strong>Username:</strong> {user.username || "не указан"}
        </p>
        <p>
          <strong>Telegram ID:</strong> {user.telegramId}
        </p>
      </section>

      <section className="block">
        <h2>Версия приложения</h2>
        <p>{APP_VERSION}</p>
      </section>

      <section className="block">
        <h2>Напоминания</h2>
        {isLoading && <p className="muted">Загрузка напоминаний...</p>}
        {error && <p className="error-text">{error}</p>}

        {!isLoading && (
          <ul className="plain-list">
            {reminders.map((item) => (
              <li className="list-item" key={item.id}>
                <div>
                  <strong>{item.order?.title ?? "Заказ"}</strong>
                  <p className="muted">{new Date(item.remindAt).toLocaleString("ru-RU")}</p>
                  <p className="muted">Канал: {item.channel}</p>
                </div>
                <div className="stack-actions">
                  <button className="ghost-btn" onClick={() => void handleToggleSent(item)} type="button">
                    {item.sent ? "Сбросить sent" : "Отметить sent"}
                  </button>
                  <button className="danger-btn" onClick={() => void handleDelete(item.id)} type="button">
                    Удалить
                  </button>
                </div>
              </li>
            ))}
            {reminders.length === 0 && <li className="muted">Напоминаний пока нет</li>}
          </ul>
        )}
      </section>
    </section>
  );
}
