const fs = require('fs');
const path = require('path');

const map = JSON.parse(
  fs.readFileSync(
    path.join('mobile/src/features/calendar/data/fruitImageFiles.json'),
    'utf8',
  ),
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
console.log('wrote fruitImages.ts', Object.keys(map).length);
