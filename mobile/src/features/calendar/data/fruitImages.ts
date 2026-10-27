import type { ImageSourcePropType } from 'react-native';

export const fruitImages: Record<string, ImageSourcePropType> = {
  "Маковое зерно": require('../../../../assets/images/fruits/fruit_01.png'),
  "Кунжутное семечко": require('../../../../assets/images/fruits/fruit_02.png'),
  "Рисовое зёрнышко": require('../../../../assets/images/fruits/fruit_03.png'),
  "Горошина": require('../../../../assets/images/fruits/fruit_04.png'),
  "Черника": require('../../../../assets/images/fruits/fruit_05.png'),
  "Малина": require('../../../../assets/images/fruits/fruit_06.png'),
  "Виноградина": require('../../../../assets/images/fruits/fruit_07.png'),
  "Оливка": require('../../../../assets/images/fruits/fruit_08.png'),
  "Кумкват": require('../../../../assets/images/fruits/fruit_09.png'),
  "Инжир": require('../../../../assets/images/fruits/fruit_10.png'),
  "Лайм": require('../../../../assets/images/fruits/fruit_11.png'),
  "Слива": require('../../../../assets/images/fruits/fruit_12.png'),
  "Нектарин": require('../../../../assets/images/fruits/fruit_13.png'),
  "Яблоко": require('../../../../assets/images/fruits/fruit_14.png'),
  "Авокадо": require('../../../../assets/images/fruits/fruit_15.png'),
  "Груша": require('../../../../assets/images/fruits/fruit_16.png'),
  "Сладкий перец": require('../../../../assets/images/fruits/fruit_17.png'),
  "Манго": require('../../../../assets/images/fruits/fruit_18.png'),
  "Банан": require('../../../../assets/images/fruits/fruit_19.png'),
  "Грейпфрут": require('../../../../assets/images/fruits/fruit_20.png'),
  "Папайя": require('../../../../assets/images/fruits/fruit_21.png'),
  "Баклажан": require('../../../../assets/images/fruits/fruit_22.png'),
  "Кукурузный початок": require('../../../../assets/images/fruits/fruit_23.png'),
  "Цветная капуста": require('../../../../assets/images/fruits/fruit_24.png'),
  "Кокос": require('../../../../assets/images/fruits/fruit_25.png'),
  "Кочан капусты": require('../../../../assets/images/fruits/fruit_26.png'),
  "Небольшая дыня": require('../../../../assets/images/fruits/fruit_27.png'),
  "Дыня": require('../../../../assets/images/fruits/fruit_28.png'),
  "Крупная дыня": require('../../../../assets/images/fruits/fruit_29.png'),
  "Небольшой арбуз": require('../../../../assets/images/fruits/fruit_30.png'),
  "Средний арбуз": require('../../../../assets/images/fruits/fruit_31.png'),
  "Кабачок": require('../../../../assets/images/fruits/fruit_32.png'),
  "Крупный кабачок": require('../../../../assets/images/fruits/fruit_33.png'),
  "Тыква": require('../../../../assets/images/fruits/fruit_34.png'),
  "Крупная тыква": require('../../../../assets/images/fruits/fruit_35.png'),
  "Арбуз": require('../../../../assets/images/fruits/fruit_36.png'),
  "Крупный арбуз": require('../../../../assets/images/fruits/fruit_37.png'),
  "Очень крупный арбуз": require('../../../../assets/images/fruits/fruit_38.png')
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

const fruitImageScales: Record<string, number> = {
  'Небольшая дыня': 0.64,
  Дыня: 0.8,
  'Крупная дыня': 0.96,
  'Небольшой арбуз': 0.62,
  'Средний арбуз': 0.72,
  Арбуз: 0.82,
  'Крупный арбуз': 0.91,
  'Очень крупный арбуз': 1,
  Кабачок: 0.72,
  'Крупный кабачок': 0.94,
  Тыква: 0.74,
  'Крупная тыква': 0.96,
};

export function getFruitImageScale(
  fruitComparison: string | null | undefined,
): number {
  return fruitComparison ? (fruitImageScales[fruitComparison] ?? 1) : 1;
}
