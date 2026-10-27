-- Support several moods per diary entry.
--
-- The diary previously stored a single required `mood`. This migration adds a
-- `moods` array, copies each existing single mood into it, and drops the legacy
-- column. Existing rows keep their original mood as the first array element.

-- AddColumn
ALTER TABLE "diary_entries"
  ADD COLUMN "moods" "DiaryMood"[] NOT NULL DEFAULT ARRAY[]::"DiaryMood"[];

-- Backfill: keep the legacy single mood as the only selected mood.
UPDATE "diary_entries"
SET "moods" = ARRAY["mood"]
WHERE "mood" IS NOT NULL;

-- DropColumn (data already migrated)
ALTER TABLE "diary_entries" DROP COLUMN "mood";
