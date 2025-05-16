-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "sent15minWarning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sent30minWarning" BOOLEAN NOT NULL DEFAULT false;
