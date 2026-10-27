const fs = require('fs');
const path = require('path');

// Progressive educational size comparisons (unique labels, non-decreasing feel).
const FRUITS = {
  1: null,
  2: 'Маковое зерно',
  3: 'Кунжутное семечко',
  4: 'Рисовое зёрнышко',
  5: 'Горошина',
  6: 'Черника',
  7: 'Малина',
  8: 'Виноградина',
  9: 'Оливка',
  10: 'Кумкват',
  11: 'Инжир',
  12: 'Лайм',
  13: 'Слива',
  14: 'Нектарин',
  15: 'Яблоко',
  16: 'Авокадо',
  17: 'Груша',
  18: 'Сладкий перец',
  19: 'Манго',
  20: 'Банан',
  21: 'Грейпфрут',
  22: 'Папайя',
  23: 'Баклажан',
  24: 'Кукурузный початок',
  25: 'Цветная капуста',
  26: 'Кокос',
  27: 'Кочан капусты',
  28: 'Небольшая дыня',
  29: 'Дыня',
  30: 'Крупная дыня',
  31: 'Небольшой арбуз',
  32: 'Средний арбуз',
  33: 'Кабачок',
  34: 'Крупный кабачок',
  35: 'Тыква',
  36: 'Крупная тыква',
  37: 'Арбуз',
  38: 'Крупный арбуз',
  39: 'Очень крупный арбуз',
  40: 'Размер новорождённого',
  41: 'Размер доношенного малыша',
  42: 'Размер малыша к родам',
};

const file = path.join('backend/prisma/info_of_weeks.json');
const weeks = JSON.parse(fs.readFileSync(file, 'utf8'));

for (const week of weeks) {
  const fruit = FRUITS[week.week];
  week.fruitComparison = fruit == null ? '—' : fruit;
  if (week.week === 13) {
    week.trimester = 1;
  }
}

fs.writeFileSync(file, `${JSON.stringify(weeks, null, 2)}\n`, 'utf8');
console.log('updated fruit comparisons for', weeks.length, 'weeks');
console.log(
  'sample',
  [3, 4, 24, 25, 35].map((weekNumber) => {
    const week = weeks.find((item) => item.week === weekNumber);
    return `${weekNumber}:${week.fruitComparison}`;
  }),
);
