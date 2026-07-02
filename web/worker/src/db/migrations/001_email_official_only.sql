-- Add newsletter "Official only" preference (matches feed nav filter).
ALTER TABLE email_subscribers ADD COLUMN official_only INTEGER NOT NULL DEFAULT 0;
