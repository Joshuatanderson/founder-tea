# Founder Tea

## Database

- **Neon** (serverless Postgres), project `founder-tea` (`solitary-sound-28208164`), region `aws-us-west-2`, in the personal Neon account `josh@mandrakelabs.org`. Never use the Lore Neon account for this project.
- The app reads `DATABASE_URL` (pooled connection string) through `src/lib/db.ts`. All queries run server-side; client components go through `/api/*` routes.
- Schema lives in `db/schema.sql`. Put schema changes in `db/migrations/` as SQL files and let the user review before applying.
- Accelerator portfolios are scraped by `scripts/scrape-*.py` into `data/scraped/*.json` and loaded with `npm run db:seed` (`scripts/seed-groups.py`, needs `psql` 17+ on `PATH` and `DATABASE_URL`).
- `scripts/e2e-verify.mjs` exercises the verify → anonymous review flow against a running site.
- The old Supabase project (`vansaiveqynjsuojnogi`) is retired; a dump of its data is in `db/backup/` (gitignored).

## Development Rules

- Never run `npm run build` - tell me when you want a visual test, I'm running in dev mode in the background
