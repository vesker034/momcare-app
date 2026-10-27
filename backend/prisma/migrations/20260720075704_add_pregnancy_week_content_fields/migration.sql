/*
  Warnings:

  - Added the required column `trimester` to the `pregnancy_week_contents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "checklist_items" ALTER COLUMN "week" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pregnancy_week_contents" ADD COLUMN     "fruitComparison" TEXT,
ADD COLUMN     "symptoms" TEXT,
ADD COLUMN     "trimester" INTEGER NOT NULL,
ADD COLUMN     "warnings" TEXT;

-- CreateIndex
CREATE INDEX "pregnancy_week_contents_trimester_idx" ON "pregnancy_week_contents"("trimester");
