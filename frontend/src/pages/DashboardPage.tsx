import { useEffect, useState } from "react";
import { fetchDashboardSummary } from "../api";
import type { DashboardSummary } from "../types/domain";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchDashboardSummary();
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить дашборд");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <h1>Дашборд</h1>
        <button className="ghost-btn" onClick={() => void loadSummary()} type="button">
          Обновить
        </button>
      </header>

      {isLoading && <p className="muted">Загрузка метрик...</p>}
      {error && <p className="error-text">{error}</p>}

      {summary && (
        <>
          <div className="stats-grid">
            <article className="stat-card">
              <span>Активные</span>
              <strong>{summary.activeOrders}</strong>
            </article>
            <article className="stat-card">
              <span>Просроченные</span>
              <strong>{summary.overdueOrders}</strong>
            </article>
            <article className="stat-card">
              <span>Доход за месяц</span>
              <strong>{summary.monthlyIncome.toLocaleString("ru-RU")} ₽</strong>
            </article>
          </div>

          <section className="block">
            <h2>Ближайшие дедлайны</h2>
            {summary.upcomingDeadlines.length === 0 ? (
              <p className="muted">Ближайших дедлайнов нет</p>
            ) : (
              <ul className="plain-list">
                {summary.upcomingDeadlines.map((item) => (
                  <li className="list-item" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <p className="muted">Клиент: {item.clientName}</p>
                    </div>
                    <time>{new Date(item.deadline).toLocaleString("ru-RU")}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}
