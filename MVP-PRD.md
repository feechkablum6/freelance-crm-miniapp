# Freelance CRM Mini App — MVP PRD

## 1. Назначение
Telegram Mini App для фрилансера: учет клиентов и заказов, контроль дедлайнов, быстрый доступ к шаблонам ответов и базовой аналитике.

## 2. Цель MVP
Собрать рабочий демонстрационный продукт для портфолио, который показывает:
- Telegram Mini App интеграцию
- Полноценный CRUD
- Работу с SQLite через Prisma
- Базовую бизнес-логику (статусы, дедлайны, напоминания, метрики)

## 3. Не-цели MVP
- Мульти-команда и роли (в MVP один владелец данных)
- Сложные интеграции с внешними CRM
- Real-time через WebSocket
- Сложная финансовая отчетность и экспорт в бухгалтерские форматы

## 4. Целевая аудитория
- Фрилансер-одиночка (Kwork/Telegram/другие каналы)
- Нужен быстрый контроль заказов, дедлайнов и коммуникаций

## 5. Основные сценарии
1. Пользователь открывает Mini App из Telegram и авторизуется через initData.
2. Создает клиента и заказ.
3. Переводит заказ по статусам (Новый -> В работе -> На проверке -> Готово -> Архив).
4. Добавляет задачи/заметки по заказу.
5. Использует шаблон сообщения для ответа клиенту.
6. Смотрит дашборд: активные, просроченные, доход за месяц, ближайшие дедлайны.

## 6. Функциональные требования (MVP)

### 6.1 Авторизация
- Вход только через Telegram WebApp initData.
- Серверная валидация initData.
- Автосоздание/обновление пользователя (upsert).

### 6.2 Клиенты
- Создать/редактировать/удалить клиента.
- Поля: имя, контакт, источник.

### 6.3 Заказы
- CRUD заказов.
- Поля: название, клиент, бюджет, статус, дедлайн.
- Фильтры: по статусу и дедлайну.
- Поиск по названию.

### 6.4 Статусы и канбан
- Фиксированный набор статусов:
  - NEW
  - IN_PROGRESS
  - IN_REVIEW
  - DONE
  - ARCHIVED
- Быстрая смена статуса из списка и карточки.

### 6.5 Чеклист и заметки
- Список задач по заказу (todo/done).
- Текстовые заметки по заказу.

### 6.6 Шаблоны сообщений
- CRUD шаблонов.
- Поля: title, body.
- Быстрое копирование текста шаблона.

### 6.7 Дашборд
- Метрики:
  - Активные заказы
  - Просроченные заказы
  - Доход за текущий месяц (по заказам в DONE)
  - Ближайшие 5 дедлайнов

### 6.8 Напоминания
- Создание напоминания по заказу (дата/время).
- Статус отправки (sent: true/false).
- Для MVP достаточно in-app списка + серверной подготовки к Telegram-уведомлениям.

## 7. Нефункциональные требования
- Адаптивность под мобильный экран Telegram.
- Время ответа API для стандартных запросов < 500 мс (локально).
- Валидация входных данных на backend.
- Логирование ошибок на backend.
- Простая структура модулей без монолитных файлов.

## 8. Технологический стек
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Fastify + TypeScript
- ORM: Prisma
- DB: SQLite
- Telegram: Mini Apps SDK + Bot API (для уведомлений на следующих этапах)

## 9. Модель данных (SQLite, Prisma)

### User
- id
- telegramId (unique)
- name
- username
- createdAt

### Client
- id
- userId (FK -> User)
- name
- contact
- source
- createdAt

### Order
- id
- userId (FK -> User)
- clientId (FK -> Client)
- title
- budget
- status (enum)
- deadline (datetime)
- createdAt
- updatedAt

### Task
- id
- orderId (FK -> Order)
- title
- done (boolean)
- position (int)

### OrderNote
- id
- orderId (FK -> Order)
- text
- createdAt

### MessageTemplate
- id
- userId (FK -> User)
- title
- body
- createdAt

### Reminder
- id
- orderId (FK -> Order)
- remindAt
- sent (boolean)
- channel (string, default: TELEGRAM)
- createdAt

## 10. API контракты (MVP)
- POST /auth/telegram
- GET /dashboard/summary
- GET /clients
- POST /clients
- PATCH /clients/:id
- DELETE /clients/:id
- GET /orders
- POST /orders
- GET /orders/:id
- PATCH /orders/:id
- DELETE /orders/:id
- POST /orders/:id/status
- GET /orders/:id/tasks
- POST /orders/:id/tasks
- PATCH /tasks/:id
- GET /orders/:id/notes
- POST /orders/:id/notes
- GET /templates
- POST /templates
- PATCH /templates/:id
- DELETE /templates/:id
- GET /reminders
- POST /reminders
- PATCH /reminders/:id
- DELETE /reminders/:id
- GET /health

## 11. Экраны Mini App (MVP)
1. DashboardPage
2. OrdersPage (list + filters)
3. OrderDetailsPage (summary + tasks + notes)
4. TemplatesPage
5. ClientsPage
6. SettingsPage (минимально: профиль Telegram, версия app)

## 12. Критерии готовности MVP (Definition of Done)
- Telegram auth работает и валидируется на сервере.
- CRUD клиентов, заказов, задач, шаблонов работает без критических ошибок.
- Статусы заказов переключаются корректно.
- Дашборд отдает и отображает 4 метрики.
- SQLite схема и миграции воспроизводимы.
- README содержит шаги запуска и 5-8 скриншотов/гиф.
- Код разбит на модули, без файлов-«свалок».

## 13. План реализации (7 дней)
- День 1: каркас frontend/backend, Prisma + SQLite, health
- День 2: auth Telegram + user
- День 3: clients + orders CRUD
- День 4: order details (tasks/notes) + status flow
- День 5: dashboard analytics
- День 6: templates + reminders
- День 7: UI-полировка, seed-данные, README, демо

## 14. Риски и смягчение
- Риск: ошибки валидации Telegram initData.
  - Решение: выделить модуль auth/telegram-verify и покрыть тестами.
- Риск: разрастание файлов.
  - Решение: сразу модульная структура (modules/services/types).
- Риск: слабый демо-эффект без данных.
  - Решение: добавить seed-скрипт с реалистичными заказами.
