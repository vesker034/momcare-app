ALTER TYPE "DoctorQuestionStatus" RENAME TO "DoctorQuestionStatus_old";
CREATE TYPE "DoctorQuestionStatus" AS ENUM ('NEW', 'ANSWERED', 'ARCHIVED');

ALTER TABLE "doctor_questions"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "doctor_questions"
  ALTER COLUMN "status" TYPE "DoctorQuestionStatus"
  USING (
    CASE "status"::TEXT
      WHEN 'DRAFT' THEN 'NEW'
      WHEN 'ASKED' THEN 'NEW'
      WHEN 'ANSWERED' THEN 'ANSWERED'
      WHEN 'NEW' THEN 'NEW'
      WHEN 'ARCHIVED' THEN 'ARCHIVED'
      ELSE 'NEW'
    END
  )::"DoctorQuestionStatus";

ALTER TABLE "doctor_questions"
  ALTER COLUMN "status" SET DEFAULT 'NEW';

DROP TYPE "DoctorQuestionStatus_old";

ALTER TABLE "doctor_questions" ADD COLUMN "visitId" TEXT;

CREATE INDEX "doctor_questions_visitId_idx" ON "doctor_questions"("visitId");

ALTER TABLE "doctor_questions"
  ADD CONSTRAINT "doctor_questions_visitId_fkey"
  FOREIGN KEY ("visitId") REFERENCES "visits"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
