const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
process.env.JWT_ACCESS_SECRET = 'local-test-secret';
const calculator = require('../src/modules/pregnancy-profile/pregnancy-calculator');
const { parseCreatePregnancyProfileDto: parseCreate, parseUpdatePregnancyProfileDto: parseUpdate } = require('../src/modules/pregnancy-profile/dto/pregnancy-profile.dto');
const { prisma } = require('../src/database/prisma.service');
const { createPregnancyProfileRouter } = require('../src/modules/pregnancy-profile/pregnancy-profile.controller');
const { errorHandler } = require('../src/shared/http/error-handler');
const cases = [[1, 0, 1], [13, 6, 1], [14, 0, 2], [27, 6, 2], [28, 0, 3], [34, 1, 3], [40, 0, 3], [42, 6, 3]];

for (const [week, day, trimester] of cases) {
  test(`current term ${week}+${day}: UTC round trip via both date methods`, () => {
    for (const now of [new Date('2026-10-26T23:59:59Z'), new Date('2024-03-10T00:01:00Z'), new Date('2024-02-29T12:00:00Z')]) {
      const result = calculator.calculatePregnancyFromCurrentWeek(week, day, now);
      assert.equal(result.pregnancyWeek, week);
      assert.equal(result.pregnancyDay, day);
      assert.equal(result.trimester, trimester);
      assert.equal(result.lastMenstrualPeriod.getUTCHours(), 0);
      assert.equal((result.dueDate - result.lastMenstrualPeriod) / 86400000, 280);
      assert.deepEqual(calculator.calculatePregnancyFromLastMenstrualPeriod(result.lastMenstrualPeriod, now), result);
      assert.deepEqual(calculator.calculatePregnancyFromDueDate(result.dueDate, now), result);
    }
  });
}

test('validation rejects invalid and competing methods for POST and PATCH', () => {
  for (const parse of [parseCreate, parseUpdate]) {
    assert.deepEqual(parse({ currentPregnancyWeek: 14 }), { currentPregnancyWeek: 14, currentPregnancyDay: 0 });
    const invalid = [null, [], {}, { currentPregnancyDay: 1 },
      ...[0, 43, -1, 1.5, '34', null].map(currentPregnancyWeek => ({ currentPregnancyWeek })),
      ...[-1, 7, 0.5, '1', null].map(currentPregnancyDay => ({ currentPregnancyWeek: 34, currentPregnancyDay })),
      { currentPregnancyWeek: 34, dueDate: '2026-12-01' },
      { currentPregnancyWeek: 34, lastMenstrualPeriod: '2026-01-01' },
      { dueDate: '2026-12-01', lastMenstrualPeriod: '2026-01-01' },
      { dueDate: '2026-12-01', currentPregnancyDay: 1 },
      { dueDate: '2026-02-30' }, { dueDate: null },
      { currentPregnancyWeek: 34, pregnancyWeek: 20 }];
    for (const body of invalid) assert.throws(() => parse(body), { statusCode: 400 });
  }
});

test('calculation is independent of host timezone and rolls over at UTC midnight', () => {
  const previous = process.env.TZ;
  try {
    const results = ['UTC', 'Pacific/Honolulu', 'Pacific/Kiritimati', 'America/New_York'].map(tz => {
      process.env.TZ = tz;
      return calculator.calculatePregnancyFromCurrentWeek(13, 6, new Date('2026-10-26T23:59:00Z'));
    });
    for (const result of results) assert.deepEqual(result, results[0]);
    const next = calculator.calculatePregnancyFromLastMenstrualPeriod(results[0].lastMenstrualPeriod, new Date('2026-10-27T00:00:00Z'));
    assert.equal(next.pregnancyWeek, 14);
    assert.equal(next.pregnancyDay, 0);
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test('POST/PATCH/GET: create, replace methods, reload, do not store stale term', async () => {
  let record = null;
  const originals = { findUnique: prisma.pregnancyProfile.findUnique, create: prisma.pregnancyProfile.create, update: prisma.pregnancyProfile.update };
  prisma.pregnancyProfile.findUnique = async ({ where }) => { assert.equal(where.userId, 'owner'); return record; };
  prisma.pregnancyProfile.create = async ({ data }) => {
    record = { ...data, id: 'profile', createdAt: new Date(), updatedAt: new Date() };
    return record;
  };
  prisma.pregnancyProfile.update = async ({ where, data }) => {
    assert.equal(where.userId, 'owner');
    record = { ...record, ...data };
    return record;
  };
  const app = express();
  app.use(express.json());
  app.use('/pregnancy-profile', createPregnancyProfileRouter());
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/pregnancy-profile`;
  const token = jwt.sign({ sub: 'owner', email: 'test@example.invalid' }, process.env.JWT_ACCESS_SECRET);
  const request = (method, body) => fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await fetch(url, { method: 'POST' })).status, 401);
    assert.equal((await request('PATCH', { currentPregnancyWeek: 34 })).status, 404);
    for (const [index, [week, day]] of cases.entries()) {
      const res = await request(index === 0 ? 'POST' : 'PATCH', { currentPregnancyWeek: week, currentPregnancyDay: day });
      assert.equal(res.status, index === 0 ? 201 : 200);
      const { profile } = await res.json();
      assert.equal(profile.pregnancyWeek, week);
      assert.equal(profile.pregnancyDay, day);
      assert.equal(record.pregnancyWeek, null);
      assert.equal(record.pregnancyDay, null);
      const reread = await request('GET');
      assert.deepEqual((await reread.json()).profile, profile);
      const byDueDate = await request('PATCH', { dueDate: profile.dueDate });
      assert.deepEqual((await byDueDate.json()).profile, profile);
      const byPeriod = await request('PATCH', { lastMenstrualPeriod: profile.lastMenstrualPeriod });
      assert.deepEqual((await byPeriod.json()).profile, profile);
    }
    assert.equal((await request('POST', { currentPregnancyWeek: 20 })).status, 409);
    assert.equal((await request('PATCH', { currentPregnancyWeek: 20, dueDate: '2026-12-01' })).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    Object.assign(prisma.pregnancyProfile, originals);
  }
});
