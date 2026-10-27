CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "DiaryMood" AS ENUM ('GREAT', 'GOOD', 'NEUTRAL', 'TIRED', 'BAD');
CREATE TYPE "VisitStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "DoctorQuestionStatus" AS ENUM ('DRAFT', 'ASKED', 'ANSWERED');
CREATE TYPE "ChecklistCategory" AS ENUM ('DOCUMENTS', 'HEALTH', 'HOSPITAL_BAG', 'BABY', 'OTHER');
CREATE TYPE "ArticleCategory" AS ENUM ('PREGNANCY', 'NUTRITION', 'ACTIVITY', 'CHECKLISTS', 'DOCTOR');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pregnancy_profiles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lastPeriodStartDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3) NOT NULL,
  "pregnancyWeek" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "pregnancy_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "diary_entries" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "entryDate" TIMESTAMP(3) NOT NULL,
  "mood" "DiaryMood" NOT NULL,
  "symptoms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "weightKg" DECIMAL(5,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "visits" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "doctorName" TEXT,
  "clinic" TEXT,
  "visitDate" TIMESTAMP(3) NOT NULL,
  "status" "VisitStatus" NOT NULL DEFAULT 'PLANNED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "doctor_questions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT,
  "status" "DoctorQuestionStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "doctor_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "checklist_items" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" "ChecklistCategory" NOT NULL DEFAULT 'OTHER',
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "articles" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" "ArticleCategory" NOT NULL,
  "summary" TEXT,
  "content" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "pregnancy_profiles_userId_key" ON "pregnancy_profiles"("userId");
CREATE INDEX "diary_entries_userId_entryDate_idx" ON "diary_entries"("userId", "entryDate");
CREATE INDEX "visits_userId_visitDate_idx" ON "visits"("userId", "visitDate");
CREATE INDEX "doctor_questions_userId_status_idx" ON "doctor_questions"("userId", "status");
CREATE INDEX "checklist_items_userId_category_idx" ON "checklist_items"("userId", "category");
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");
CREATE INDEX "articles_category_isPublished_idx" ON "articles"("category", "isPublished");

ALTER TABLE "pregnancy_profiles" ADD CONSTRAINT "pregnancy_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visits" ADD CONSTRAINT "visits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_questions" ADD CONSTRAINT "doctor_questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
