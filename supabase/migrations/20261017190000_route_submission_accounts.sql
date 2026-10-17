-- Route suggestions need Google or Facebook sign-in from now on, like feedback, so admins
-- can see who sent a route and contributors can be credited for approved ones. Older
-- suggestions stay anonymous (NULL). The account's name and email still go in
-- "submitterName" and "submitterContact", which the admin pages and privacy lookup read.
--
-- Deleting the Supabase Auth user (a data deletion request) deletes their suggestions.
-- Routes already published stay: community_jeep_route holds no personal data and
-- doesn't depend on the submission.
ALTER TABLE "route_submission"
  ADD COLUMN "userId" UUID REFERENCES auth.users ("id") ON DELETE CASCADE,
  ADD COLUMN "provider" TEXT;

-- For the per-account rate limit and each sender's record on the admin page.
CREATE INDEX "route_submission_userId_createdAt_idx" ON "route_submission" ("userId", "createdAt");
