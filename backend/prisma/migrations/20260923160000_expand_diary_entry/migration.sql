-- Expand the diary entry model:
--   * wellbeing rating, energy level (1..5), sleep quality, water, medication status,
--     basal temperature;
--   * symptoms are moved to a separate table together with severity;
--   * one entry per user per calendar day (unique userId + entryDate);
--   * mood list is extended and TIRED is removed (fatigue is an energy level / symptom).

-- CreateEnum
CREATE TYPE "SymptomSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "SleepQuality" AS ENUM ('POOR', 'FAIR', 'GOOD', 'EXCELLENT');

-- CreateEnum
CREATE TYPE "MedicationStatus" AS ENUM ('ON_TIME', 'LATE', 'MISSED', 'NOT_APPLICABLE');

-- AlterEnum (DiarySymptom): build the new value list first; the old type stays
-- untouched until the legacy array column is migrated and dropped.
CREATE TYPE "DiarySymptom_new" AS ENUM (
  'NAUSEA',
  'VOMITING',
  'FATIGUE',
  'HEADACHE',
  'DIZZINESS',
  'HEARTBURN',
  'BACK_PAIN',
  'ABDOMINAL_DISCOMFORT',
  'SHORTNESS_OF_BREATH',
  'SWELLING',
  'FREQUENT_URINATION',
  'SLEEP_PROBLEMS',
  'CONSTIPATION',
  'LEG_CRAMPS',
  'OTHER'
);

-- Normalize stored dates to the user's calendar day (midnight) so that the
-- unique constraint below matches the "one entry per day" rule.
UPDATE "diary_entries"
SET "entryDate" = DATE_TRUNC('day', "entryDate")
WHERE "entryDate" <> DATE_TRUNC('day', "entryDate");

-- Keep the most recently updated entry when a user already has several rows
-- for the same calendar day.
DELETE FROM "diary_entries" AS entry
WHERE EXISTS (
  SELECT 1
  FROM "diary_entries" AS other
  WHERE other."userId" = entry."userId"
    AND other."entryDate" = entry."entryDate"
    AND (
      other."updatedAt" > entry."updatedAt"
      OR (other."updatedAt" = entry."updatedAt" AND other."id" > entry."id")
    )
);

-- CreateTable
CREATE TABLE "diary_symptom_entries" (
  "id" TEXT NOT NULL,
  "diaryEntryId" TEXT NOT NULL,
  "type" "DiarySymptom_new" NOT NULL,
  "severity" "SymptomSeverity" NOT NULL,

  CONSTRAINT "diary_symptom_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diary_symptom_entries_diaryEntryId_type_key" ON "diary_symptom_entries"("diaryEntryId", "type");

-- AddForeignKey
ALTER TABLE "diary_symptom_entries" ADD CONSTRAINT "diary_symptom_entries_diaryEntryId_fkey" FOREIGN KEY ("diaryEntryId") REFERENCES "diary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Move the legacy symptom array into the new table. Severity for legacy rows is
-- MILD because the old contract had no severity; NO_SYMPTOMS becomes an empty
-- list; SWEET_CRAVINGS is stored as OTHER.
INSERT INTO "diary_symptom_entries" ("id", "diaryEntryId", "type", "severity")
SELECT
  GEN_RANDOM_UUID()::TEXT,
  symptom_rows."diaryEntryId",
  symptom_rows."type"::"DiarySymptom_new",
  'MILD'
FROM (
  SELECT
    entry."id" AS "diaryEntryId",
    mapped."type" AS "type"
  FROM "diary_entries" AS entry
  CROSS JOIN LATERAL UNNEST(entry."symptoms") AS legacy_symptom(value)
  CROSS JOIN LATERAL (
    SELECT
      CASE legacy_symptom.value::TEXT
        WHEN 'NO_SYMPTOMS' THEN NULL
        WHEN 'SWEET_CRAVINGS' THEN 'OTHER'
        ELSE legacy_symptom.value::TEXT
      END AS "type"
  ) AS mapped
  WHERE mapped."type" IS NOT NULL
  GROUP BY entry."id", mapped."type"
) AS symptom_rows;

-- The old mood list contains TIRED; keep such entries as NEUTRAL and record the
-- fatigue as a symptom so the information is not lost.
INSERT INTO "diary_symptom_entries" ("id", "diaryEntryId", "type", "severity")
SELECT
  GEN_RANDOM_UUID()::TEXT,
  entry."id",
  'FATIGUE',
  'MILD'
FROM "diary_entries" AS entry
WHERE entry."mood"::TEXT = 'TIRED'
  AND NOT EXISTS (
    SELECT 1
    FROM "diary_symptom_entries" AS existing
    WHERE existing."diaryEntryId" = entry."id"
      AND existing."type"::TEXT = 'FATIGUE'
  );

-- DropColumn (legacy array column, data already migrated)
ALTER TABLE "diary_entries" DROP COLUMN "symptoms";

-- AlterEnum (DiarySymptom): swap in the new value list
ALTER TYPE "DiarySymptom" RENAME TO "DiarySymptom_old";
ALTER TYPE "DiarySymptom_new" RENAME TO "DiarySymptom";
DROP TYPE "DiarySymptom_old";

-- AlterEnum (DiaryMood): extend the list and map legacy values
CREATE TYPE "DiaryMood_new" AS ENUM (
  'JOYFUL',
  'CALM',
  'NEUTRAL',
  'SAD',
  'ANXIOUS',
  'IRRITATED',
  'OVERWHELMED',
  'HOPEFUL',
  'GRATEFUL',
  'RELAXED',
  'EXCITED',
  'CONFIDENT',
  'SENSITIVE',
  'LONELY'
);

ALTER TABLE "diary_entries"
  ALTER COLUMN "mood" TYPE "DiaryMood_new"
  USING (
    CASE "mood"::TEXT
      WHEN 'CALM' THEN 'CALM'
      WHEN 'JOYFUL' THEN 'JOYFUL'
      WHEN 'ANXIOUS' THEN 'ANXIOUS'
      WHEN 'TIRED' THEN 'NEUTRAL'
      ELSE 'NEUTRAL'
    END
  )::"DiaryMood_new";

ALTER TYPE "DiaryMood" RENAME TO "DiaryMood_old";
ALTER TYPE "DiaryMood_new" RENAME TO "DiaryMood";
DROP TYPE "DiaryMood_old";

-- AlterTable: new diary entry columns
ALTER TABLE "diary_entries" ADD COLUMN "wellbeingRating" INTEGER;
ALTER TABLE "diary_entries" ADD COLUMN "sleepQuality" "SleepQuality";
ALTER TABLE "diary_entries" ADD COLUMN "waterMl" INTEGER;
ALTER TABLE "diary_entries" ADD COLUMN "medicationStatus" "MedicationStatus";
ALTER TABLE "diary_entries" ADD COLUMN "basalTemperatureC" DOUBLE PRECISION;

-- Required fields get a neutral placeholder for legacy rows: the old contract did
-- not store them. Values are the middle of the scale, no interpretation is made.
UPDATE "diary_entries" SET "wellbeingRating" = 3 WHERE "wellbeingRating" IS NULL;
UPDATE "diary_entries" SET "sleepQuality" = 'FAIR' WHERE "sleepQuality" IS NULL;
UPDATE "diary_entries" SET "sleepHours" = 7 WHERE "sleepHours" IS NULL;

ALTER TABLE "diary_entries" ALTER COLUMN "wellbeingRating" SET NOT NULL;
ALTER TABLE "diary_entries" ALTER COLUMN "sleepQuality" SET NOT NULL;
ALTER TABLE "diary_entries" ALTER COLUMN "sleepHours" SET NOT NULL;

-- AlterTable: energyLevel changes from the HIGH/MEDIUM/LOW enum to a 1..5 scale
ALTER TABLE "diary_entries"
  ALTER COLUMN "energyLevel" TYPE INTEGER
  USING (
    CASE "energyLevel"::TEXT
      WHEN 'HIGH' THEN 5
      WHEN 'MEDIUM' THEN 3
      WHEN 'LOW' THEN 1
      ELSE 3
    END
  );

UPDATE "diary_entries" SET "energyLevel" = 3 WHERE "energyLevel" IS NULL;
ALTER TABLE "diary_entries" ALTER COLUMN "energyLevel" SET NOT NULL;

-- DropEnum
DROP TYPE "EnergyLevel";

-- DropIndex: replaced by the unique constraint below
DROP INDEX "diary_entries_userId_entryDate_idx";

-- CreateIndex
CREATE UNIQUE INDEX "diary_entries_userId_entryDate_key" ON "diary_entries"("userId", "entryDate");
