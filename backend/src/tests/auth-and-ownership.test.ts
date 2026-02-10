import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { createSessionToken } from "../modules/auth/session-token.js";
import { prisma } from "../services/prisma.js";

type Fixtures = {
  owner: { id: string };
  intruder: { id: string };
  ownerClient: { id: string };
  intruderClient: { id: string };
  ownerOrder: { id: string };
  intruderOrder: { id: string };
  ownerTask: { id: string };
  ownerTemplate: { id: string };
};

let app: FastifyInstance;
let fixtures: Fixtures;

function authHeader(userId: string) {
  return {
    authorization: `Bearer ${createSessionToken(userId)}`,
  };
}

async function resetDatabase() {
  await prisma.reminder.deleteMany();
  await prisma.orderNote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.order.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
}

async function seedFixtures(): Promise<Fixtures> {
  const nonce = BigInt(Date.now());

  const owner = await prisma.user.create({
    data: {
      telegramId: 910000000000n + nonce,
      name: "Owner",
      username: "owner",
    },
    select: {
      id: true,
    },
  });

  const intruder = await prisma.user.create({
    data: {
      telegramId: 920000000000n + nonce,
      name: "Intruder",
      username: "intruder",
    },
    select: {
      id: true,
    },
  });

  const ownerClient = await prisma.client.create({
    data: {
      userId: owner.id,
      name: "Owner Client",
    },
    select: {
      id: true,
    },
  });

  const intruderClient = await prisma.client.create({
    data: {
      userId: intruder.id,
      name: "Intruder Client",
    },
    select: {
      id: true,
    },
  });

  const ownerOrder = await prisma.order.create({
    data: {
      userId: owner.id,
      clientId: ownerClient.id,
      title: "Owner Order",
      budget: 1000,
    },
    select: {
      id: true,
    },
  });

  const intruderOrder = await prisma.order.create({
    data: {
      userId: intruder.id,
      clientId: intruderClient.id,
      title: "Intruder Order",
      budget: 500,
    },
    select: {
      id: true,
    },
  });

  const ownerTask = await prisma.task.create({
    data: {
      orderId: ownerOrder.id,
      title: "Owner Task",
      position: 0,
    },
    select: {
      id: true,
    },
  });

  const ownerTemplate = await prisma.messageTemplate.create({
    data: {
      userId: owner.id,
      title: "Owner Template",
      body: "Hello",
    },
    select: {
      id: true,
    },
  });

  return {
    owner,
    intruder,
    ownerClient,
    intruderClient,
    ownerOrder,
    intruderOrder,
    ownerTask,
    ownerTemplate,
  };
}

before(async () => {
  app = await buildApp();
  await app.ready();
});

beforeEach(async () => {
  await resetDatabase();
  fixtures = await seedFixtures();
});

after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test("does not trust x-user-id header in production mode", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers: {
      "x-user-id": fixtures.owner.id,
    },
  });

  assert.equal(response.statusCode, 401);
});

test("accepts signed bearer token for current user", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers: authHeader(fixtures.owner.id),
  });

  assert.equal(response.statusCode, 200);
  const payload = response.json() as { user: { id: string } };
  assert.equal(payload.user.id, fixtures.owner.id);
});

test("rejects forged bearer token", async () => {
  const validToken = createSessionToken(fixtures.owner.id);
  const forgedToken = `${validToken.slice(0, -1)}x`;

  const response = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers: {
      authorization: `Bearer ${forgedToken}`,
    },
  });

  assert.equal(response.statusCode, 401);
});

test("blocks cross-user client update", async () => {
  const response = await app.inject({
    method: "PATCH",
    url: `/clients/${fixtures.ownerClient.id}`,
    headers: authHeader(fixtures.intruder.id),
    payload: {
      name: "Hacked",
    },
  });

  assert.equal(response.statusCode, 404);
});

test("allows owner to update own client", async () => {
  const response = await app.inject({
    method: "PATCH",
    url: `/clients/${fixtures.ownerClient.id}`,
    headers: authHeader(fixtures.owner.id),
    payload: {
      name: "Updated Name",
    },
  });

  assert.equal(response.statusCode, 200);
  const payload = response.json() as { item: { name: string } };
  assert.equal(payload.item.name, "Updated Name");
});

test("blocks creating order with foreign client", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/orders",
    headers: authHeader(fixtures.owner.id),
    payload: {
      clientId: fixtures.intruderClient.id,
      title: "Illegal Order",
      budget: 123,
    },
  });

  assert.equal(response.statusCode, 404);
});

test("blocks cross-user order update", async () => {
  const response = await app.inject({
    method: "PATCH",
    url: `/orders/${fixtures.ownerOrder.id}`,
    headers: authHeader(fixtures.intruder.id),
    payload: {
      title: "Hacked Order",
    },
  });

  assert.equal(response.statusCode, 404);
});

test("blocks cross-user task update", async () => {
  const response = await app.inject({
    method: "PATCH",
    url: `/tasks/${fixtures.ownerTask.id}`,
    headers: authHeader(fixtures.intruder.id),
    payload: {
      done: true,
    },
  });

  assert.equal(response.statusCode, 404);
});

test("blocks cross-user reminder creation", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/reminders",
    headers: authHeader(fixtures.owner.id),
    payload: {
      orderId: fixtures.intruderOrder.id,
      remindAt: new Date().toISOString(),
      channel: "TELEGRAM",
    },
  });

  assert.equal(response.statusCode, 404);
});

test("blocks cross-user template deletion", async () => {
  const response = await app.inject({
    method: "DELETE",
    url: `/templates/${fixtures.ownerTemplate.id}`,
    headers: authHeader(fixtures.intruder.id),
  });

  assert.equal(response.statusCode, 404);
});
