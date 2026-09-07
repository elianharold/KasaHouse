-- CreateEnum
CREATE TYPE "AuthChannel" AS ENUM ('SMS', 'EMAIL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
-- DEFAULT 'SMS' backfills any existing challenge rows (all of which were SMS).
ALTER TABLE "otp_challenges" ADD COLUMN     "channel" "AuthChannel" NOT NULL DEFAULT 'SMS',
ADD COLUMN     "email" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "otp_challenges_email_createdAt_idx" ON "otp_challenges"("email", "createdAt");

