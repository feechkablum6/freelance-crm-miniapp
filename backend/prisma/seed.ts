import { prisma } from "../src/services/prisma.js";

async function clearDatabase() {
  await prisma.reminder.deleteMany();
  await prisma.orderNote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.order.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearDatabase();

  const user = await prisma.user.create({
    data: {
      telegramId: 900000000001n,
      name: "Akashi Dev",
      username: "akashi_dev",
    },
  });

  const [kworkClient, tgClient, siteClient] = await Promise.all([
    prisma.client.create({
      data: {
        userId: user.id,
        name: "Игорь Kwork",
        contact: "@igor_kwork",
        source: "Kwork",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: "Мария Telegram",
        contact: "@maria_design",
        source: "Telegram",
      },
    }),
    prisma.client.create({
      data: {
        userId: user.id,
        name: "Алексей Site",
        contact: "alex@example.com",
        source: "Direct",
      },
    }),
  ]);

  const now = Date.now();
  const orderA = await prisma.order.create({
    data: {
      userId: user.id,
      clientId: kworkClient.id,
      title: "Chrome Extension Automation",
      budget: 18000,
      status: "IN_PROGRESS",
      deadline: new Date(now + 1000 * 60 * 60 * 24 * 2),
    },
  });

  const orderB = await prisma.order.create({
    data: {
      userId: user.id,
      clientId: tgClient.id,
      title: "Telegram Mini App MVP",
      budget: 26000,
      status: "IN_REVIEW",
      deadline: new Date(now + 1000 * 60 * 60 * 24),
    },
  });

  const orderC = await prisma.order.create({
    data: {
      userId: user.id,
      clientId: siteClient.id,
      title: "Landing Refactor",
      budget: 12000,
      status: "DONE",
      deadline: new Date(now - 1000 * 60 * 60 * 24 * 3),
    },
  });

  await Promise.all([
    prisma.task.createMany({
      data: [
        {
          orderId: orderA.id,
          title: "Собрать требования",
          done: true,
          position: 0,
        },
        {
          orderId: orderA.id,
          title: "Сделать API интеграцию",
          done: false,
          position: 1,
        },
      ],
    }),
    prisma.orderNote.createMany({
      data: [
        {
          orderId: orderA.id,
          text: "Клиент просил добавить экспорт в CSV.",
        },
        {
          orderId: orderB.id,
          text: "Ожидается фидбек после демонстрации.",
        },
      ],
    }),
    prisma.messageTemplate.createMany({
      data: [
        {
          userId: user.id,
          title: "Старт работы",
          body: "Привет. Начинаю работу по заказу, сегодня отправлю первый апдейт.",
        },
        {
          userId: user.id,
          title: "Финальный апдейт",
          body: "Проект готов. Отправляю результаты, проверьте пожалуйста и дайте обратную связь.",
        },
      ],
    }),
    prisma.reminder.createMany({
      data: [
        {
          orderId: orderA.id,
          remindAt: new Date(now + 1000 * 60 * 60 * 6),
          sent: false,
          channel: "TELEGRAM",
        },
        {
          orderId: orderB.id,
          remindAt: new Date(now + 1000 * 60 * 60 * 2),
          sent: false,
          channel: "TELEGRAM",
        },
        {
          orderId: orderC.id,
          remindAt: new Date(now - 1000 * 60 * 60 * 24),
          sent: true,
          channel: "TELEGRAM",
        },
      ],
    }),
  ]);

  console.log("Seed completed", {
    userId: user.id,
    orders: [orderA.id, orderB.id, orderC.id],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
