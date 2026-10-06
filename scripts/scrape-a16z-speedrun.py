#!/usr/bin/env python3
"""a16z speedrun portfolio -> data/scraped/a16z-speedrun.json

Source: public JSON API behind https://speedrun.a16z.com/companies
  list:   https://speedrun-api.a16z.com/api/companies/companies/?limit=96&offset=N&ordering=name
  detail: https://speedrun-api.a16z.com/api/companies/companies/<id>/   (has website_url, linkedin_url, founded_year)
Run: python3 scripts/scrape-a16z-speedrun.py
"""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from portfolio_util import fetch, to_domain, row, write

API = "https://speedrun-api.a16z.com/api/companies/companies/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "scraped", "a16z-speedrun.json")
# Cohort start years are not in the API; inferred from public cohort announcements.
COHORT_YEAR = {"SR001": 2023, "SR002": 2024, "SR003": 2024, "SR004": 2025, "SR005": 2025, "SR006": 2026, "SR007": 2026}

def main():
    items, url, total = [], API + "?limit=96&offset=0&ordering=name", None
    while url:
        d = json.loads(fetch(url))
        total = d["count"]
        items += d["results"]
        url = d.get("next")
    with ThreadPoolExecutor(8) as ex:
        details = list(ex.map(lambda c: json.loads(fetch(API + c["id"] + "/")), items))
    rows, dropped = [], []
    for c in details:
        dom = to_domain(c.get("website_url"))
        if not dom:
            dropped.append((c["name"], c.get("website_url")))
            continue
        cohort = c.get("cohort")
        rows.append(row(c["name"], dom, c.get("logo"), c.get("linkedin_url"), c.get("city"), c.get("country"),
                        c.get("industries"), [cohort] if cohort else [], COHORT_YEAR.get(cohort), c.get("founded_year") or None))
    for n, w in dropped:
        print("  dropped:", n, "|", w)
    write(OUT, rows, total, len(dropped))

if __name__ == "__main__":
    main()
