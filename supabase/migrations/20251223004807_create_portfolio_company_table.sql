-- Portfolio companies from accelerators (Techstars, etc.)
CREATE TABLE portfolio_company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  domain TEXT,
  year INTEGER,
  program TEXT,
  location TEXT,
  industries TEXT,
  description TEXT,
  image_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  crunchbase_url TEXT,
  batch TEXT,
  source TEXT NOT NULL DEFAULT 'techstars',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE portfolio_company ENABLE ROW LEVEL SECURITY;

-- Portfolio companies are publicly readable
CREATE POLICY "Portfolio companies are publicly readable"
  ON portfolio_company
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Index for common queries
CREATE INDEX idx_portfolio_company_year ON portfolio_company(year);
CREATE INDEX idx_portfolio_company_source ON portfolio_company(source);
