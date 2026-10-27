const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crcB = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeB, data]));
  crcB.writeUInt32BE(crc);
  return Buffer.concat([len, typeB, data, crcB]);
}

function png(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y += 1) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x += 1) {
      const i = y * (w * 3 + 1) + 1 + x * 3;
      raw[i] = rgb[0];
      raw[i + 1] = rgb[1];
      raw[i + 2] = rgb[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const weeks = JSON.parse(
  fs.readFileSync(path.join('backend/prisma/info_of_weeks.json'), 'utf8'),
);
const fruits = [
  ...new Set(
    weeks
      .map((week) => week.fruitComparison)
      .filter((value) => value && value !== '—'),
  ),
];
const colors = [
  [217, 108, 143],
  [242, 168, 141],
  [143, 122, 184],
  [79, 154, 119],
  [47, 128, 237],
  [184, 76, 90],
  [255, 183, 77],
  [129, 199, 132],
];

const dir = 'mobile/assets/images/fruits';
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

const map = {};
fruits.forEach((fruit, index) => {
  const file = `fruit_${String(index + 1).padStart(2, '0')}.png`;
  fs.writeFileSync(path.join(dir, file), png(160, 160, colors[index % colors.length]));
  map[fruit] = `fruits/${file}`;
});

fs.writeFileSync(
  'mobile/src/features/calendar/data/fruitImageFiles.json',
  `${JSON.stringify(map, null, 2)}\n`,
  'utf8',
);

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

fs.writeFileSync('mobile/src/features/calendar/data/fruitImages.ts', out, 'utf8');
console.log('generated', fruits.length, 'fruit placeholders');
