ALTER TYPE "DiaryMood" RENAME TO "DiaryMood_old";
CREATE TYPE "DiaryMood" AS ENUM ('CALM', 'JOYFUL', 'TIRED', 'ANXIOUS');

ALTER TABLE "diary_entries"
  ALTER COLUMN "mood" TYPE "DiaryMood"
  USING (
    CASE "mood"::TEXT
      WHEN 'GREAT' THEN 'JOYFUL'
      WHEN 'GOOD' THEN 'CALM'
      WHEN 'NEUTRAL' THEN 'CALM'
      WHEN 'TIRED' THEN 'TIRED'
      WHEN 'BAD' THEN 'ANXIOUS'
      WHEN 'CALM' THEN 'CALM'
      WHEN 'JOYFUL' THEN 'JOYFUL'
      WHEN 'ANXIOUS' THEN 'ANXIOUS'
      ELSE 'CALM'
    END
  )::"DiaryMood";

DROP TYPE "DiaryMood_old";

CREATE TYPE "DiarySymptom" AS ENUM (
  'NO_SYMPTOMS',
  'NAUSEA',
  'FATIGUE',
  'SHORTNESS_OF_BREATH',
  'SWELLING',
  'SWEET_CRAVINGS'
);

ALTER TABLE "diary_entries"
  ADD COLUMN "symptoms_new" "DiarySymptom"[] NOT NULL DEFAULT ARRAY[]::"DiarySymptom"[];

UPDATE "diary_entries"
SET "symptoms_new" = ARRAY(
    SELECT (
      CASE UPPER(symptom)
        WHEN 'NO_SYMPTOMS' THEN 'NO_SYMPTOMS'
        WHEN 'NAUSEA' THEN 'NAUSEA'
        WHEN 'FATIGUE' THEN 'FATIGUE'
        WHEN 'TIREDNESS' THEN 'FATIGUE'
        WHEN 'SHORTNESS_OF_BREATH' THEN 'SHORTNESS_OF_BREATH'
        WHEN 'SWELLING' THEN 'SWELLING'
        WHEN 'SWEET_CRAVINGS' THEN 'SWEET_CRAVINGS'
        ELSE 'NO_SYMPTOMS'
      END
    )::"DiarySymptom"
    FROM UNNEST("symptoms") AS symptom
  );

ALTER TABLE "diary_entries" DROP COLUMN "symptoms";

ALTER TABLE "diary_entries" RENAME COLUMN "symptoms_new" TO "symptoms";

ALTER TABLE "diary_entries"
  ALTER COLUMN "symptoms" SET DEFAULT ARRAY[]::"DiarySymptom"[];

CREATE TYPE "EnergyLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

ALTER TABLE "diary_entries" ADD COLUMN "energyLevel" "EnergyLevel";
