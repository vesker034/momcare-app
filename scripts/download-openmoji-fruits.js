const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = 'mobile/assets/images/fruits';
const MAP_JSON = 'mobile/src/features/calendar/data/fruitImageFiles.json';

// OpenMoji CC BY-SA 4.0 — https://openmoji.org
const FRUIT_TO_CODE = {
  'Маковое зерно': '1F33F',
  'Кунжутное семечко': '1F330',
  'Рисовое зёрнышко': '1F33E',
  Горошина: '1FAD8',
  Черника: '1FAD0',
  Малина: '1F353',
  Виноградина: '1F347',
  Оливка: '1FAD2',
  Кумкват: '1F34A',
  Инжир: '1F351',
  Лайм: '1F34B',
  Слива: '1F351',
  Нектарин: '1F351',
  Яблоко: '1F34E',
  Авокадо: '1F951',
  Груша: '1F350',
  'Сладкий перец': '1F336',
  Манго: '1F96D',
  Банан: '1F34C',
  Грейпфрут: '1F34A',
  Папайя: '1F965',
  Баклажан: '1F346',
  'Кукурузный початок': '1F33D',
  'Цветная капуста': '1F966',
  Кокос: '1F965',
  'Кочан капусты': '1F966',
  'Небольшая дыня': '1F348',
  Дыня: '1F348',
  'Крупная дыня': '1F348',
  'Небольшой арбуз': '1F349',
  'Средний арбуз': '1F349',
  Кабачок: '1F952',
  'Крупный кабачок': '1F952',
  Тыква: '1F383',
  'Крупная тыква': '1F383',
  Арбуз: '1F349',
  'Крупный арбуз': '1F349',
  'Очень крупный арбуз': '1F349',
  'Размер новорождённого': '1F476',
  'Размер доношенного малыша': '1F476',
  'Размер малыша к родам': '1F476',
};

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          download(response.headers.location).then(resolve, reject);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const labels = Object.keys(FRUIT_TO_CODE);
  const map = {};

  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index];
    const code = FRUIT_TO_CODE[label];
    const file = `fruit_${String(index + 1).padStart(2, '0')}.png`;
    const url = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/72x72/${code}.png`;
    const buffer = await download(url);
    fs.writeFileSync(path.join(OUT_DIR, file), buffer);
    map[label] = `fruits/${file}`;
    console.log('ok', label, code);
  }

  fs.writeFileSync(MAP_JSON, `${JSON.stringify(map, null, 2)}\n`, 'utf8');

  const entries = Object.entries(map)
    .map(
      ([label, file]) =>
        `  ${JSON.stringify(label)}: require('../../../../assets/images/${file}')`,
    )
    .join(',\n');

  const out = `import type { ImageSourcePropType } from 'react-native';

export const fruitImages: Record<string, ImageSourcePropType> = {
${entries}
};

export function hasFruitComparison(
  fruitComparison: string | null | undefined,
): fruitComparison is string {
  if (!fruitComparison) {
    return false;
  }

  const trimmed = fruitComparison.trim();
  return trimmed !== '' && trimmed !== '—';
}

export function getFruitImage(
  fruitComparison: string | null | undefined,
): ImageSourcePropType | null {
  if (!hasFruitComparison(fruitComparison)) {
    return null;
  }

  return fruitImages[fruitComparison] ?? null;
}
`;

  fs.writeFileSync(
    'mobile/src/features/calendar/data/fruitImages.ts',
    out,
    'utf8',
  );

  fs.writeFileSync(
    'mobile/assets/images/fruits/ATTRIBUTION.txt',
    `Иллюстрации фруктов и овощей: OpenMoji (https://openmoji.org)
Лицензия: CC BY-SA 4.0
Источник файлов: https://github.com/hfg-gmuend/openmoji
`,
    'utf8',
  );

  console.log('done', labels.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
