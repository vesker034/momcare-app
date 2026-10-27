CREATE TABLE "pregnancy_week_contents" (
  "id" TEXT NOT NULL,
  "week" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "babyDevelopment" TEXT NOT NULL,
  "motherChanges" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "babySize" TEXT,
  "babyWeight" TEXT,
  "babyLength" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "pregnancy_week_contents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pregnancy_week_contents_week_key" ON "pregnancy_week_contents"("week");

ALTER TABLE "checklist_items" ADD COLUMN "week" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "checklist_items" ADD COLUMN "description" TEXT;
ALTER TABLE "checklist_items" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "checklist_items" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "user_checklist_progress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "checklistItemId" TEXT NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_checklist_progress_pkey" PRIMARY KEY ("id")
);

INSERT INTO "user_checklist_progress" ("id", "userId", "checklistItemId", "isCompleted", "createdAt", "updatedAt")
SELECT md5(random()::TEXT || clock_timestamp()::TEXT), "userId", "id", "isCompleted", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "checklist_items";

DROP INDEX IF EXISTS "checklist_items_userId_category_idx";
ALTER TABLE "checklist_items" DROP CONSTRAINT IF EXISTS "checklist_items_userId_fkey";
ALTER TABLE "checklist_items" DROP COLUMN "userId";
ALTER TABLE "checklist_items" DROP COLUMN "isCompleted";
ALTER TABLE "checklist_items" DROP COLUMN "dueDate";

CREATE INDEX "checklist_items_week_sortOrder_idx" ON "checklist_items"("week", "sortOrder");
CREATE INDEX "checklist_items_category_idx" ON "checklist_items"("category");
CREATE UNIQUE INDEX "user_checklist_progress_userId_checklistItemId_key" ON "user_checklist_progress"("userId", "checklistItemId");
CREATE INDEX "user_checklist_progress_checklistItemId_idx" ON "user_checklist_progress"("checklistItemId");

ALTER TABLE "user_checklist_progress"
  ADD CONSTRAINT "user_checklist_progress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_checklist_progress"
  ADD CONSTRAINT "user_checklist_progress_checklistItemId_fkey"
  FOREIGN KEY ("checklistItemId") REFERENCES "checklist_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "articles" ADD COLUMN "pregnancyWeek" INTEGER;
ALTER TABLE "articles" ADD COLUMN "readingTimeMinutes" INTEGER;
CREATE INDEX "articles_pregnancyWeek_idx" ON "articles"("pregnancyWeek");
