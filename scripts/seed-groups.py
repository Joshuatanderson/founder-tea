#!/usr/bin/env python3
"""Load scraped accelerator portfolios into validation_group / validation_group_member.

Reads data/scraped/<source>.json (written by the scrape-*.py scripts) and upserts
one validation_group per source plus one member row per company domain.
Safe to re-run: existing rows are updated, nothing is deleted.

Usage: DATABASE_URL=postgres://... python3 scripts/seed-groups.py [source ...]
"""
import csv
import io
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRAPED = ROOT / "data" / "scraped"

# source file stem -> (group name, group website)
GROUPS = {
    "yc": ("Y Combinator", "https://www.ycombinator.com"),
    "techstars": ("Techstars", "https://techstars.com"),
    "antler": ("Antler", "https://www.antler.co"),
    "era": ("ERA", "https://www.eranyc.com"),
    "pear": ("Pear VC", "https://pear.vc"),
    "a16z-speedrun": ("a16z speedrun", "https://speedrun.a16z.com"),
    "500-global": ("500 Global", "https://500.co"),
    "alchemist": ("Alchemist Accelerator", "https://www.alchemistaccelerator.com"),
    "south-park-commons": ("South Park Commons", "https://www.southparkcommons.com"),
    "neo": ("Neo", "https://neo.com"),
}

COLUMNS = [
    "domain", "company_name", "logo_url", "linkedin_url", "city", "country",
    "industry_vertical", "program_names", "first_session_year", "founded_year",
    "worldregion", "worldsubregion", "is_exit", "is_unicorn",
]
ARRAY_COLUMNS = {"industry_vertical", "program_names"}


def pg_array(values):
    escaped = ['"' + str(v).replace("\\", "\\\\").replace('"', '\\"') + '"' for v in values if v is not None]
    return "{" + ",".join(escaped) + "}"


def to_csv(rows):
    out = io.StringIO()
    writer = csv.writer(out)
    seen = set()
    for row in rows:
        domain = (row.get("domain") or "").strip().lower()
        if not domain or domain in seen:
            continue
        seen.add(domain)
        line = []
        for col in COLUMNS:
            value = domain if col == "domain" else row.get(col)
            if value is None:
                line.append("")
            elif col in ARRAY_COLUMNS:
                line.append(pg_array(value))
            elif isinstance(value, bool):
                line.append("t" if value else "f")
            else:
                line.append(str(value).replace("\x00", ""))
        writer.writerow(line)
    return out.getvalue(), len(seen)


def psql(script):
    result = subprocess.run(
        ["psql", os.environ["DATABASE_URL"], "-v", "ON_ERROR_STOP=1", "-qAt", "-f", "-"],
        input=script, capture_output=True, text=True,
    )
    if result.returncode != 0:
        sys.exit(result.stderr)
    return result.stdout.strip()


def seed(source):
    name, website = GROUPS[source]
    rows = json.loads((SCRAPED / f"{source}.json").read_text())
    data, count = to_csv(rows)
    with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as handle:
        handle.write(data)
        csv_path = handle.name
    quoted_name = name.replace("'", "''")
    update_cols = [c for c in COLUMNS if c != "domain"]
    script = f"""
begin;
insert into validation_group (name, website)
select '{quoted_name}', '{website}'
where not exists (select 1 from validation_group where name = '{quoted_name}');

create temp table staging (
  domain text, company_name text, logo_url text, linkedin_url text, city text, country text,
  industry_vertical text[], program_names text[], first_session_year integer, founded_year integer,
  worldregion text, worldsubregion text, is_exit boolean, is_unicorn boolean
) on commit drop;
\\copy staging from '{csv_path}' with (format csv)

insert into validation_group_member (validation_group_id, {", ".join(COLUMNS)})
select (select id from validation_group where name = '{quoted_name}'), {", ".join(COLUMNS)}
from staging
on conflict (validation_group_id, domain) do update set
  {", ".join(f"{c} = coalesce(excluded.{c}, validation_group_member.{c})" for c in update_cols)};
commit;
select count(*) from validation_group_member
where validation_group_id = (select id from validation_group where name = '{quoted_name}');
"""
    total = psql(script)
    os.unlink(csv_path)
    print(f"{name}: {count} scraped domains upserted, {total} members in group")


def main():
    if not os.environ.get("DATABASE_URL"):
        sys.exit("DATABASE_URL is not set")
    sources = sys.argv[1:] or [s for s in GROUPS if (SCRAPED / f"{s}.json").exists()]
    for source in sources:
        if source not in GROUPS:
            sys.exit(f"Unknown source {source!r}; add it to GROUPS")
        seed(source)


if __name__ == "__main__":
    main()
