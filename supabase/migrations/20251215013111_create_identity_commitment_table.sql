-- Identity commitment table: stores Semaphore identity commitments
-- These are the leaves of the Merkle tree for each validation group
-- No user/email info stored - only the cryptographic commitment
CREATE TABLE identity_commitment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_group_id UUID NOT NULL REFERENCES validation_group(id) ON DELETE CASCADE,

  -- The Semaphore identity commitment (Poseidon hash of EdDSA public key)
  -- Stored as text since it's a ~254-bit BigInt, typically hex or decimal string
  commitment TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each commitment can only exist once per group
  UNIQUE(validation_group_id, commitment)
);

-- Index for commitment lookups (used during proof verification)
CREATE INDEX identity_commitment_commitment_idx ON identity_commitment(commitment);

-- Index for group lookups (used when building Merkle tree)
CREATE INDEX identity_commitment_group_idx ON identity_commitment(validation_group_id);

-- Enable Row Level Security
ALTER TABLE identity_commitment ENABLE ROW LEVEL SECURITY;

-- Commitments are publicly readable (needed for Merkle tree construction)
CREATE POLICY "Identity commitments are publicly readable"
  ON identity_commitment
  FOR SELECT
  TO anon, authenticated
  USING (true);
