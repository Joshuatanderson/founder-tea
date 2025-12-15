-- Reviews table for VC reviews
-- Uses nullifier to prevent duplicate reviews (same identity + same VC = same nullifier)
create table review (
  id uuid primary key default gen_random_uuid(),
  vc_id uuid not null references vc(id) on delete cascade,
  validation_group_id uuid not null references validation_group(id),
  nullifier text not null unique,
  content text not null,
  created_at timestamptz default now()
);

-- Index for fetching reviews by VC
create index idx_review_vc_id on review(vc_id);

-- Index for nullifier lookups (duplicate prevention)
create index idx_review_nullifier on review(nullifier);

-- RLS: public read access
alter table review enable row level security;
create policy "Public read access" on review for select using (true);
