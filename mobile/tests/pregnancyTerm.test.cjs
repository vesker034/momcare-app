const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

const filename = path.resolve(__dirname, '../src/shared/utils/pregnancyTerm.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const loaded = new Module(filename, module);
loaded._compile(compiled, filename);
const { formatWeeks, formatDays, formatPregnancyTerm, formatDaysRemaining,
  formatWeeksRemaining, formatPregnancyWeekTitle } = loaded.exports;

const cases = [
  [0, 'недель', 'дней'], [1, 'неделя', 'день'], [2, 'недели', 'дня'],
  [4, 'недели', 'дня'], [5, 'недель', 'дней'], [11, 'недель', 'дней'],
  [14, 'недель', 'дней'], [21, 'неделя', 'день'], [22, 'недели', 'дня'],
  [25, 'недель', 'дней'], [31, 'неделя', 'день'], [34, 'недели', 'дня'],
  [42, 'недели', 'дня'],
];
for (const [count, weeks, days] of cases) {
  test(`Склонение недель и дней: ${count}`, () => {
    assert.equal(formatWeeks(count), `${count} ${weeks}`);
    assert.equal(formatDays(count), `${count} ${days}`);
    assert.equal(formatPregnancyTerm(count), `${count} ${weeks}`);
    assert.equal(formatDaysRemaining(count), `${days === 'день' ? 'Остался' : 'Осталось'} ${count} ${days}`);
    assert.equal(formatWeeksRemaining(count), `${weeks === 'неделя' ? 'Осталась' : 'Осталось'} ${count} ${weeks}`);
  });
}
test('Составной срок и порядковый номер недели', () => {
  assert.equal(formatPregnancyTerm(34, 1), '34 недели 1 день');
  assert.equal(formatPregnancyTerm(35, 2), '35 недель 2 дня');
  assert.equal(formatPregnancyTerm(1, 0), '1 неделя 0 дней');
  assert.equal(formatPregnancyWeekTitle(34), '34-я неделя');
  assert.equal(formatDays(111), '111 дней');
  assert.equal(formatDays(121), '121 день');
});
