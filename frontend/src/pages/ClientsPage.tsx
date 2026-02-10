import { useEffect, useState, type FormEvent } from "react";
import { createClient, deleteClient, fetchClients, updateClient } from "../api";
import type { Client } from "../types/domain";

interface ClientFormState {
  name: string;
  contact: string;
  source: string;
}

const EMPTY_FORM: ClientFormState = {
  name: "",
  contact: "",
  source: "",
};

export function ClientsPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadClients = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setItems(await fetchClients());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить клиентов");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingId) {
        await updateClient(editingId, form);
      } else {
        await createClient(form);
      }

      resetForm();
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить клиента");
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      contact: client.contact ?? "",
      source: client.source ?? "",
    });
  };

  const handleDelete = async (clientId: string) => {
    try {
      await deleteClient(clientId);
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить клиента");
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h1>Клиенты</h1>
        <button className="ghost-btn" onClick={() => void loadClients()} type="button">
          Обновить
        </button>
      </header>

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          placeholder="Имя клиента"
          required
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          placeholder="Контакт"
          value={form.contact}
          onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
        />
        <input
          placeholder="Источник"
          value={form.source}
          onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
        />
        <div className="form-actions">
          <button className="primary-btn" type="submit">
            {editingId ? "Сохранить" : "Добавить"}
          </button>
          {editingId && (
            <button className="ghost-btn" type="button" onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>
      </form>

      {isLoading && <p className="muted">Загрузка списка клиентов...</p>}
      {error && <p className="error-text">{error}</p>}

      {!isLoading && !error && (
        <ul className="plain-list">
          {items.map((client) => (
            <li className="list-item" key={client.id}>
              <div>
                <strong>{client.name}</strong>
                <p className="muted">{client.contact || "Контакт не указан"}</p>
                <p className="muted">Источник: {client.source || "не указан"}</p>
              </div>
              <div className="inline-actions">
                <button className="ghost-btn" onClick={() => handleEdit(client)} type="button">
                  Изменить
                </button>
                <button className="danger-btn" onClick={() => void handleDelete(client.id)} type="button">
                  Удалить
                </button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="muted">Пока нет клиентов</li>}
        </ul>
      )}
    </section>
  );
}
