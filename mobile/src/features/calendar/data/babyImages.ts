import type { ImageSourcePropType } from 'react-native';

const babyStageImages = [
  require('../../../../assets/images/babies/baby_stage_1_2.png'),
  require('../../../../assets/images/babies/baby_stage_3_4.png'),
  require('../../../../assets/images/babies/baby_stage_5_6.png'),
  require('../../../../assets/images/babies/baby_stage_7_8.png'),
  require('../../../../assets/images/babies/baby_stage_9_12.png'),
  require('../../../../assets/images/babies/baby_stage_13_16.png'),
  require('../../../../assets/images/babies/baby_stage_17_20.png'),
  require('../../../../assets/images/babies/baby_stage_21_24.png'),
  require('../../../../assets/images/babies/baby_stage_25_28.png'),
  require('../../../../assets/images/babies/baby_stage_29_32.png'),
  require('../../../../assets/images/babies/baby_stage_33_36.png'),
  require('../../../../assets/images/babies/baby_stage_37_42.png'),
] as const;

const newbornImage = require('../../../../assets/images/babies/newborn_comparison.png');

export function getBabyDevelopmentImage(
  week: number | null | undefined,
): ImageSourcePropType | null {
  if (typeof week !== 'number' || !Number.isInteger(week) || week < 1) {
    return null;
  }

  if (week > 42) {
    return null;
  }

  if (week <= 2) return babyStageImages[0];
  if (week <= 4) return babyStageImages[1];
  if (week <= 6) return babyStageImages[2];
  if (week <= 8) return babyStageImages[3];
  if (week <= 12) return babyStageImages[4];
  if (week <= 16) return babyStageImages[5];
  if (week <= 20) return babyStageImages[6];
  if (week <= 24) return babyStageImages[7];
  if (week <= 28) return babyStageImages[8];
  if (week <= 32) return babyStageImages[9];
  if (week <= 36) return babyStageImages[10];
  return babyStageImages[11];
}

export function getNewbornComparisonImage() {
  return newbornImage;
}
