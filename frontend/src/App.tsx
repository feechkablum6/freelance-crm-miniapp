import { useEffect, useMemo, useState } from "react";
import { authDev, authWithTelegram, clearAuthToken, getMe, setAuthToken } from "./api";
import {
  ClientsPage,
  DashboardPage,
  OrderDetailsPage,
  OrdersPage,
  SettingsPage,
  TemplatesPage,
} from "./pages";
import type { User } from "./types/domain";
import "./App.css";

type Page = "dashboard" | "orders" | "clients" | "templates" | "settings" | "order-details";

interface NavigationItem {
  id: Exclude<Page, "order-details">;
  label: string;
}

const NAV_ITEMS: NavigationItem[] = [
  { id: "dashboard", label: "Дашборд" },
  { id: "orders", label: "Заказы" },
  { id: "clients", label: "Клиенты" },
  { id: "templates", label: "Шаблоны" },
  { id: "settings", label: "Настройки" },
];

function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const telegramInitData = useMemo(
    () => window.Telegram?.WebApp?.initData?.trim() ?? "",
    []
  );

  const bootstrapAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }

      if (telegramInitData.length > 0) {
        const response = await authWithTelegram(telegramInitData);
        setAuthToken(response.token);
        setUser(response.user);
        return;
      }

      try {
        const me = await getMe();
        setUser(me.user);
        return;
      } catch {
        clearAuthToken();

        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const response = await authDev({
          telegramId: tgUser?.id ?? 900000000001,
          name: tgUser ? `${tgUser.first_name} ${tgUser.last_name ?? ""}`.trim() : "Local Dev",
          username: tgUser?.username ?? "local_dev",
        });
        setAuthToken(response.token);
        setUser(response.user);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Не удалось выполнить авторизацию");
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    void bootstrapAuth();
  }, []);

  const renderPage = () => {
    if (activePage === "dashboard") {
      return <DashboardPage />;
    }

    if (activePage === "orders") {
      return (
        <OrdersPage
          onOpenDetails={(orderId) => {
            setSelectedOrderId(orderId);
            setActivePage("order-details");
          }}
        />
      );
    }

    if (activePage === "clients") {
      return <ClientsPage />;
    }

    if (activePage === "templates") {
      return <TemplatesPage />;
    }

    if (activePage === "settings") {
      return user ? <SettingsPage user={user} /> : null;
    }

    if (activePage === "order-details" && selectedOrderId !== null) {
      return (
        <OrderDetailsPage
          orderId={selectedOrderId}
          onBack={() => {
            setActivePage("orders");
          }}
        />
      );
    }

    return <DashboardPage />;
  };

  if (authLoading) {
    return (
      <div className="app">
        <p className="muted">Авторизация...</p>
      </div>
    );
  }

  if (authError || !user) {
    return (
      <div className="app">
        <h1>Freelance CRM</h1>
        <p className="error-text">{authError ?? "Пользователь не найден"}</p>
        <button className="primary-btn" onClick={() => void bootstrapAuth()} type="button">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="brand">Freelance CRM</p>
          <p className="muted">{user.name}</p>
        </div>
      </header>

      <main className="page-container">{renderPage()}</main>

      {activePage !== "order-details" && (
        <nav className="tabbar">
          {NAV_ITEMS.map((item) => (
            <button
              className={item.id === activePage ? "tab active" : "tab"}
              key={item.id}
              onClick={() => setActivePage(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export default App;
