-- Validation group table: represents groups used for identity verification
-- Examples: YC founders, Techstars alumni, A16Z-backed founders, etc.
CREATE TABLE validation_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE validation_group ENABLE ROW LEVEL SECURITY;

-- Allow public read access to validation groups
CREATE POLICY "Validation groups are publicly readable"
  ON validation_group
  FOR SELECT
  TO anon, authenticated
  USING (true);
