-- Add company metadata fields to validation_group_member
ALTER TABLE validation_group_member
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS industry_vertical text[],
ADD COLUMN IF NOT EXISTS program_names text[],
ADD COLUMN IF NOT EXISTS first_session_year integer,
ADD COLUMN IF NOT EXISTS founded_year integer,
ADD COLUMN IF NOT EXISTS worldregion text,
ADD COLUMN IF NOT EXISTS worldsubregion text,
ADD COLUMN IF NOT EXISTS is_exit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_unicorn boolean DEFAULT false;

-- Add index on company_name for lookups
CREATE INDEX IF NOT EXISTS idx_validation_group_member_company_name
ON validation_group_member(company_name);

-- Add index on first_session_year for filtering by cohort year
CREATE INDEX IF NOT EXISTS idx_validation_group_member_session_year
ON validation_group_member(first_session_year);
