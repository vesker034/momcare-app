const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { Prisma } = require('@prisma/client');
process.env.JWT_ACCESS_SECRET = 'local-test-secret';
const { prisma } = require('../src/database/prisma.service');
const { registerUsersModule } = require('../src/modules/users/users.module');
const { registerAuthModule } = require('../src/modules/auth/auth.module');
const { errorHandler } = require('../src/shared/http/error-handler');

test('PATCH /users/me: authorization, validation, isolation and public response', async () => {
  const date = new Date('2026-10-26T00:00:00Z');
  let record = { id: 'own-id', name: 'Катя', email: 'test@example.invalid', role: 'USER', passwordHash: 'private', createdAt: date, updatedAt: date };
  const originalUpdate = prisma.user.update;
  const originalFind = prisma.user.findUnique;
  prisma.user.update = async ({ where, data }) => {
    assert.equal(where.id, 'own-id');
    assert.deepEqual(Object.keys(data), ['name']);
    if (!record) throw new Prisma.PrismaClientKnownRequestError('Missing', { code: 'P2025', clientVersion: '6' });
    record = { ...record, ...data };
    return record;
  };
  prisma.user.findUnique = async () => record;
  const app = express();
  app.use(express.json());
  registerUsersModule(app);
  registerAuthModule(app);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const token = jwt.sign({ sub: 'own-id', email: record.email }, process.env.JWT_ACCESS_SECRET);
  const patch = (body, authorized = true) => fetch(`${url}/users/me`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(authorized ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await patch({ name: 'Мария' }, false)).status, 401);
    for (const name of ['', '   ', 'А', 'А'.repeat(61), null, 12]) {
      assert.equal((await patch({ name })).status, 400);
    }
    for (const field of ['role', 'email', 'id', 'password', 'passwordHash']) {
      assert.equal((await patch({ name: 'Мария', [field]: 'changed' })).status, 400);
      assert.equal(record.name, 'Катя');
    }
    const response = await patch({ name: '  Мария  ' });
    assert.equal(response.status, 200);
    const { user } = await response.json();
    assert.equal(user.name, 'Мария');
    assert.equal(user.role, 'USER');
    assert.equal(user.id, 'own-id');
    assert.equal('passwordHash' in user, false);
    const me = await fetch(`${url}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal((await me.json()).user.name, 'Мария');
    for (const name of ['Ая', 'А'.repeat(60)]) assert.equal((await patch({ name })).status, 200);
    record = null;
    assert.equal((await patch({ name: 'Мария' })).status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    prisma.user.update = originalUpdate;
    prisma.user.findUnique = originalFind;
  }
});
