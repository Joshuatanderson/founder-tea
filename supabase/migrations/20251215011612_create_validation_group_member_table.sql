-- Validation group member table: domains that belong to a validation group
-- When a user verifies their email, we check if their domain is in this table
CREATE TABLE validation_group_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_group_id UUID NOT NULL REFERENCES validation_group(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each domain can only appear once per group
  UNIQUE(validation_group_id, domain)
);

-- Index for domain lookups (used during email verification)
CREATE INDEX validation_group_member_domain_idx ON validation_group_member(domain);

-- Enable Row Level Security
ALTER TABLE validation_group_member ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Validation group members are publicly readable"
  ON validation_group_member
  FOR SELECT
  TO anon, authenticated
  USING (true);
