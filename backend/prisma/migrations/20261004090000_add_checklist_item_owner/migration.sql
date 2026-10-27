-- AlterTable
ALTER TABLE "checklist_items" ADD COLUMN "ownerUserId" TEXT;

-- CreateIndex
CREATE INDEX "checklist_items_ownerUserId_idx" ON "checklist_items"("ownerUserId");

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
