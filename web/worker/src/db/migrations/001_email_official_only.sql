-- Add newsletter "Official only" preference (matches feed nav filter).
-- Run on existing D1 databases (schema.sql alone does not ALTER existing tables):
--   npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/migrations/001_email_official_only.sql
--   npx wrangler d1 execute cursorunofficialnews --remote --file=web/worker/src/db/migrations/001_email_official_only.sql
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS official_only INTEGER NOT NULL DEFAULT 0;
