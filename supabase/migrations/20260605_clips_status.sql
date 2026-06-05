-- Add status column to clips for pipeline validation flow.
-- Default 'approved' keeps all existing clips visible in the feed.
-- New clips ingested via the pipeline land as 'pending' and require admin approval.

ALTER TABLE clips
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved'));

CREATE INDEX IF NOT EXISTS clips_status_idx ON clips (status);
