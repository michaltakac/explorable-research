-- Add column to track the hash of published content for version comparison
ALTER TABLE projects ADD COLUMN IF NOT EXISTS published_content_hash TEXT;
