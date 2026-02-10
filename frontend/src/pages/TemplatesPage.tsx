import { useEffect, useState, type FormEvent } from "react";
import { createTemplate, deleteTemplate, fetchTemplates, updateTemplate } from "../api";
import type { MessageTemplate } from "../types/domain";

interface TemplateForm {
  title: string;
  body: string;
}

const EMPTY_FORM: TemplateForm = {
  title: "",
  body: "",
};

export function TemplatesPage() {
  const [items, setItems] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setItems(await fetchTemplates());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить шаблоны");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingId) {
        await updateTemplate(editingId, form);
      } else {
        await createTemplate(form);
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить шаблон");
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setForm({
      title: template.title,
      body: template.body,
    });
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить шаблон");
    }
  };

  const handleCopy = async (body: string) => {
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      setError("Не удалось скопировать шаблон");
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h1>Шаблоны сообщений</h1>
        <button className="ghost-btn" onClick={() => void loadTemplates()} type="button">
          Обновить
        </button>
      </header>

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          placeholder="Заголовок"
          required
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        />
        <textarea
          placeholder="Текст шаблона"
          required
          rows={4}
          value={form.body}
          onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
        />
        <div className="form-actions">
          <button className="primary-btn" type="submit">
            {editingId ? "Сохранить" : "Создать"}
          </button>
          {editingId && (
            <button
              className="ghost-btn"
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingId(null);
              }}
              type="button"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {isLoading && <p className="muted">Загрузка шаблонов...</p>}
      {error && <p className="error-text">{error}</p>}

      {!isLoading && (
        <ul className="plain-list">
          {items.map((template) => (
            <li className="list-item" key={template.id}>
              <div>
                <strong>{template.title}</strong>
                <p>{template.body}</p>
              </div>
              <div className="stack-actions">
                <button className="ghost-btn" onClick={() => void handleCopy(template.body)} type="button">
                  Копировать
                </button>
                <button className="ghost-btn" onClick={() => handleEdit(template)} type="button">
                  Изменить
                </button>
                <button className="danger-btn" onClick={() => void handleDelete(template.id)} type="button">
                  Удалить
                </button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="muted">Шаблонов пока нет</li>}
        </ul>
      )}
    </section>
  );
}
