#!/usr/bin/env python3
"""Scrape every Techstars portfolio company into data/scraped/techstars.json.

Source: the Typesense index behind https://www.techstars.com/portfolio.
The site hands out the cluster URL, collection and a search-only key at
https://www.techstars.com/api/search/config/companies ; we fetch that fresh on
every run (the key may rotate), then page through the whole collection.

Usage: python3 scripts/scrape-techstars.py [--out PATH] [--raw PATH]
Stdlib only. Prints a summary (source total, rows written, drops, per-year).
"""
import argparse
import collections
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

CONFIG_URL = "https://www.techstars.com/api/search/config/companies"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
PER_PAGE = 250  # Typesense maximum

# Shared hosts that say nothing about a company's email domain. A website is
# dropped when its host equals one of these or is a subdomain of one.
GENERIC_HOSTS = {
    "linkedin.com", "twitter.com", "x.com", "t.co", "facebook.com", "fb.com", "fb.me",
    "instagram.com", "tiktok.com", "youtube.com", "youtu.be", "vimeo.com", "pinterest.com",
    "reddit.com", "tumblr.com", "medium.com", "substack.com", "github.com", "github.io",
    "gitlab.com", "apple.com", "google.com", "goo.gl", "forms.gle", "amazon.com",
    "notion.site", "notion.so", "linktr.ee", "beacons.ai", "bio.link", "lnk.bio",
    "taplink.cc", "about.me", "carrd.co", "crunchbase.com", "angel.co", "wellfound.com",
    "f6s.com", "producthunt.com", "techstars.com", "devpost.com", "kickstarter.com",
    "indiegogo.com", "gumroad.com", "patreon.com", "etsy.com", "shopify.com",
    "myshopify.com", "wixsite.com", "wix.com", "webflow.io", "squarespace.com",
    "wordpress.com", "blogspot.com", "weebly.com", "godaddysites.com", "strikingly.com",
    "mystrikingly.com", "site123.me", "business.site", "tilda.ws", "canva.site",
    "framer.website", "framer.app", "framer.ai", "herokuapp.com", "vercel.app",
    "netlify.app", "pages.dev", "web.app", "firebaseapp.com", "azurewebsites.net",
    "amazonaws.com", "cloudfront.net", "bubbleapps.io", "glideapp.io", "softr.app",
    "replit.app", "lovable.app", "calendly.com", "typeform.com", "mailchi.mp",
    "bit.ly", "tinyurl.com", "t.me", "wa.me", "whatsapp.com", "discord.gg",
    "discord.com", "itch.io", "steampowered.com", "yelp.com", "gmail.com",
    "hubspotpagebuilder.com", "ueniweb.com", "tiiny.site",
}
HOST_RE = re.compile(r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,}$")


def get_json(url, headers=None):
    last = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:  # retry transient network errors
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise SystemExit(f"request failed: {url}: {last}")


def fetch_all():
    cfg = get_json(CONFIG_URL)
    base = f"{cfg['url'].rstrip('/')}/collections/{cfg['collection']}/documents/search"
    headers = {"X-TYPESENSE-API-KEY": cfg["apiKey"]}
    docs, found, page = {}, None, 1
    while True:
        qs = urllib.parse.urlencode({"q": "*", "per_page": PER_PAGE, "page": page,
                                     "sort_by": "website_order:asc"})
        d = get_json(f"{base}?{qs}", headers)
        found = d["found"]
        hits = d.get("hits", [])
        for h in hits:
            docs[h["document"]["id"]] = h["document"]
        if not hits or page * PER_PAGE >= found:
            break
        page += 1
    return base, found, list(docs.values())


def norm_domain(website):
    """Return (domain, reason): bare lowercase host, or None plus why it was dropped."""
    # Some source values carry zero-width characters; strip them before parsing.
    w = re.sub(r"[\u200b-\u200d\u2060\ufeff]", "", website or "").strip().lower()
    if not w:
        return None, "missing"
    w = w.split()[0]
    if not re.match(r"^[a-z][a-z0-9+.-]*://", w):
        w = "http://" + w.lstrip("/")
    try:
        host = urllib.parse.urlsplit(w).hostname or ""
    except ValueError:
        return None, "invalid"
    host = host.strip(".")
    while host.startswith("www."):
        host = host[4:]
    if not HOST_RE.match(host):
        return None, "invalid"
    if any(host == g or host.endswith("." + g) for g in GENERIC_HOSTS):
        return None, "generic"
    return host, None


def norm_url(u):
    u = (u or "").strip()
    if not u:
        return None
    if u.startswith("//"):
        return "https:" + u
    return u if re.match(r"^https?://", u, re.I) else "https://" + u


def s(v):
    v = v.strip() if isinstance(v, str) else v
    return v or None


def to_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def to_row(doc, domain):
    iv = [x for x in (doc.get("industry_vertical") or []) if x]
    return {
        "company_name": s(doc.get("company_name")),
        "domain": domain,
        "logo_url": norm_url(doc.get("logo_url")),
        "linkedin_url": norm_url(doc.get("linkedin_url")),
        "city": s(doc.get("city")),
        "country": s(doc.get("country")),
        "worldregion": s(doc.get("worldregion")),
        "worldsubregion": s(doc.get("worldsubregion")),
        "industry_vertical": iv or None,
        "program_names": [x for x in (doc.get("program_names") or []) if x],
        "first_session_year": to_int(doc.get("first_session_year")),
        "founded_year": to_int(doc.get("founded_year") or doc.get("year_founded")),
        "is_exit": bool(doc.get("is_exit")),
        "is_unicorn": bool(doc.get("is_1b")),
    }


def merge(a, b):
    """Merge two rows for one domain: earliest year wins, gaps filled from the other."""
    ya, yb = a["first_session_year"], b["first_session_year"]
    base, other = (b, a) if (yb is not None and (ya is None or yb < ya)) else (a, b)
    out = dict(base)
    for k, v in other.items():
        if out[k] is None:
            out[k] = v
    out["program_names"] = list(dict.fromkeys(base["program_names"] + other["program_names"]))
    if base["industry_vertical"] or other["industry_vertical"]:
        out["industry_vertical"] = list(dict.fromkeys(
            (base["industry_vertical"] or []) + (other["industry_vertical"] or [])))
    out["is_exit"] = a["is_exit"] or b["is_exit"]
    out["is_unicorn"] = a["is_unicorn"] or b["is_unicorn"]
    return out


def main():
    root = Path(__file__).resolve().parent.parent
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(root / "data/scraped/techstars.json"))
    ap.add_argument("--raw", help="optional path to also dump the raw Typesense documents")
    args = ap.parse_args()

    endpoint, found, docs = fetch_all()
    if args.raw:
        Path(args.raw).write_text(json.dumps(docs))

    drops, rows, dupes = collections.Counter(), {}, 0
    for doc in docs:
        domain, reason = norm_domain(doc.get("website"))
        if not domain:
            drops[reason] += 1
            continue
        row = to_row(doc, domain)
        if not row["company_name"]:
            drops["no_name"] += 1
            continue
        if domain in rows:
            dupes += 1
            rows[domain] = merge(rows[domain], row)
        else:
            rows[domain] = row

    out = sorted(rows.values(), key=lambda r: (r["first_session_year"] or 9999,
                                               (r["company_name"] or "").lower(), r["domain"]))
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")

    years = collections.Counter(r["first_session_year"] for r in out)
    print(json.dumps({
        "endpoint": endpoint,
        "source_found": found,
        "docs_fetched": len(docs),
        "accelerator_docs": sum(1 for d in docs if d.get("is_accelerator_company")),
        "network_only_docs": sum(1 for d in docs if not d.get("is_accelerator_company")),
        "dropped": dict(drops),
        "merged_duplicate_domains": dupes,
        "rows_written": len(out),
        "exits": sum(r["is_exit"] for r in out),
        "unicorns": sum(r["is_unicorn"] for r in out),
        "with_founded_year": sum(r["founded_year"] is not None for r in out),
        "per_year": {str(k): years[k] for k in sorted(years, key=lambda y: y or 0)},
        "doc_fields": sorted({k for d in docs for k in d}),
    }, indent=1), file=sys.stderr)


if __name__ == "__main__":
    main()
