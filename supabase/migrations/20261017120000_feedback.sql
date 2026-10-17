-- Feedback from riders who signed in with Google or Facebook through Supabase Auth.
-- Signing in keeps out anonymous spam and lets an admin reply by email.
--
-- Like every other table: row level security on with no policies, so only the server's
-- secret key (service_role) reads or writes it. Riders never query it directly.

CREATE TYPE "FeedbackTopic" AS ENUM ('WRONG_FARE', 'WRONG_ROUTE', 'APP_PROBLEM', 'SUGGESTION', 'OTHER');
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'RESOLVED');

CREATE TABLE "feedback" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    -- Deleting the Supabase Auth user (a data deletion request) deletes their feedback.
    "userId" UUID NOT NULL REFERENCES auth.users ("id") ON DELETE CASCADE,
    "userEmail" TEXT,
    "userName" TEXT,
    "provider" TEXT NOT NULL,
    "topic" "FeedbackTopic" NOT NULL,
    -- The app checks 10 to 2000 characters; this keeps a bypassed check from storing a novel.
    "message" TEXT NOT NULL CHECK (char_length("message") BETWEEN 1 AND 2000),
    -- The page the rider was on, e.g. the fare map with their trip, so an admin can open it.
    "pagePath" TEXT CHECK (char_length("pagePath") <= 500),
    "locale" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "resolvedAt" TIMESTAMPTZ(3),
    "resolvedByEmail" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feedback_status_createdAt_idx" ON "feedback" ("status", "createdAt");
-- For the per-rider rate limit, which counts a rider's recent feedback.
CREATE INDEX "feedback_userId_createdAt_idx" ON "feedback" ("userId", "createdAt");

CREATE TRIGGER "feedback_updated_at" BEFORE UPDATE ON "feedback" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON "feedback" TO service_role;
