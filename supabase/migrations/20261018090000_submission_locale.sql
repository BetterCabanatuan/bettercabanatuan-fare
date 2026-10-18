-- The language the submitter was reading in, so the email telling them an admin approved
-- or rejected their TODA or route arrives in that language. Older submissions predate
-- the column and get English.
ALTER TABLE "toda_submission" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "route_submission" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
