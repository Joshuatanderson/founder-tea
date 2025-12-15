-- VC firms table
-- v1: firms only, not individual partners
CREATE TABLE vc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE vc ENABLE ROW LEVEL SECURITY;

-- VCs are publicly readable
CREATE POLICY "VCs are publicly readable"
  ON vc
  FOR SELECT
  TO anon, authenticated
  USING (true);
