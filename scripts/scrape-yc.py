#!/usr/bin/env python3
"""Scrape every Y Combinator portfolio company into data/scraped/yc.json.

Primary source: YC's public Algolia index (the one behind
https://www.ycombinator.com/companies). The app id and search key are read
from that page at runtime. Algolia caps a query at 1000 hits, so we page
batch by batch and check each batch against its facet count.
Fallback: the community mirror https://yc-oss.github.io/api/companies/all.json
(pass --mirror to force it).

Usage: python3 scripts/scrape-yc.py [--mirror]
Stdlib only. Writes data/scraped/yc.json and prints a summary to stderr.
"""
import collections
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "scraped" / "yc.json"
MIRROR = "https://yc-oss.github.io/api/companies/all.json"
PSL_URL = "https://publicsuffix.org/list/public_suffix_list.dat"
UA = {"User-Agent": "Mozilla/5.0 (founder-tea yc scraper)"}
INDEX = "YCCompany_production"

# Hosts that are never a company's own email domain. A row is dropped when its
# website sits on one of these, unless the website is the bare root of the host
# (so Reddit -> reddit.com and Substack -> substack.com survive).
GENERIC = {
    "linkedin.com", "twitter.com", "x.com", "facebook.com", "fb.com", "fb.me",
    "instagram.com", "tiktok.com", "youtube.com", "youtu.be", "github.com",
    "gitlab.com", "bitbucket.org", "apple.com", "google.com", "goo.gl",
    "notion.site", "notion.so", "linktr.ee", "medium.com", "substack.com",
    "t.me", "telegram.org", "telegram.me", "discord.gg", "discord.com",
    "bit.ly", "tinyurl.com", "typeform.com", "calendly.com", "angel.co",
    "wellfound.com", "crunchbase.com", "ycombinator.com", "producthunt.com",
    "amazon.com", "amzn.to", "microsoft.com", "wa.me", "whatsapp.com",
    "reddit.com", "pinterest.com", "threads.net", "twitch.tv", "slack.com",
    "airtable.com", "carrd.co", "webflow.io", "vercel.app", "netlify.app",
    "herokuapp.com", "github.io", "gitlab.io", "wixsite.com", "wix.com",
    "myshopify.com", "framer.website", "framer.app", "framer.ai", "super.site",
    "softr.app", "bubbleapps.io", "glideapp.io", "replit.app", "repl.co",
    "pages.dev", "workers.dev", "web.app", "firebaseapp.com", "appspot.com",
    "wordpress.com", "squarespace.com", "weebly.com", "gitbook.io",
    "readme.io", "itch.io", "huggingface.co", "streamlit.app", "fly.dev",
    "onrender.com", "azurewebsites.net", "amazonaws.com", "cloudfront.net",
    "godaddysites.com", "square.site", "mystrikingly.com", "tilda.ws",
    "lovable.app", "devpost.com", "kickstarter.com", "indiegogo.com",
    "gumroad.com", "patreon.com", "chromewebstore.google.com", "sites.google.com",
    "bento.me", "beacons.ai", "about.me", "tally.so", "canva.site", "figma.com",
    "figma.site", "testflight.apple.com", "apps.apple.com", "play.google.com",
    "webflow.com", "notion.com", "vercel.com", "wixstudio.com", "base44.app",
    "luma.com", "lu.ma", "blogspot.com", "itunes.apple.com", "tumblr.com", "wordpress.org", "ngrok.io", "ngrok.app", "railway.app", "surge.sh",
}
# Second-level labels that sit under a two-letter country code (co.uk, com.au).
SLD = {"co", "com", "org", "net", "ac", "gov", "edu", "or", "ne", "go", "gob", "nom", "ltd", "plc"}
SEASON = {"winter": "W", "spring": "X", "summer": "S", "fall": "F"}
SEASON_ORDER = {"W": 0, "X": 1, "S": 2, "F": 3, "IK": 4}
# YC "regions" values that are world regions rather than countries or tags.
WORLD_REGIONS = [
    "United States of America", "Canada", "Latin America", "Europe",
    "Middle East and North Africa", "Africa", "South Asia", "Southeast Asia",
    "East Asia", "Oceania",
]
REGION_ALIAS = {"United States of America": "North America", "Canada": "North America"}
COUNTRY_ALIAS = {"USA": "United States", "UK": "United Kingdom", "UAE": "United Arab Emirates"}


def get(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def fetch_algolia():
    page = html.unescape(get("https://www.ycombinator.com/companies").decode("utf-8", "ignore"))
    opts = json.loads(re.search(r"AlgoliaOpts\s*=\s*(\{.*?\})", page).group(1))
    app, key = opts["app"], opts["key"]
    url = f"https://{app}-dsn.algolia.net/1/indexes/{INDEX}/query?x-algolia-application-id={app}&x-algolia-api-key={key}"
    hdr = {"Content-Type": "application/json", "Origin": "https://www.ycombinator.com", "Referer": "https://www.ycombinator.com/"}

    def q(params):
        return json.loads(get(url, json.dumps({"params": urllib.parse.urlencode(params)}).encode(), hdr))

    head = q({"query": "", "hitsPerPage": 0, "facets": '["batch"]', "maxValuesPerFacet": 1000})
    facets, total = head["facets"]["batch"], head["nbHits"]
    rows = {}
    for batch, n in sorted(facets.items()):
        if n > 1000:
            raise SystemExit(f"batch {batch} has {n} > 1000 hits; needs a finer split")
        got, p = 0, 0
        while True:
            r = q({"query": "", "hitsPerPage": 1000, "page": p, "facetFilters": json.dumps([f"batch:{batch}"])})
            for h in r["hits"]:
                rows[h["id"]] = h
            got += len(r["hits"])
            p += 1
            if p >= r["nbPages"]:
                break
        if got != n:
            raise SystemExit(f"batch {batch}: got {got}, facet says {n}")
    if len(rows) != total:
        print(f"WARNING: fetched {len(rows)} unique ids but index reports {total} (companies with no batch?)", file=sys.stderr)
    return list(rows.values()), {"source": "algolia", "index_total": total, "batch_facets": facets}


def fetch_mirror():
    return json.loads(get(MIRROR)), {"source": "mirror"}


def load_psl():
    """ICANN section of the Public Suffix List (the list of real suffixes such
    as com, co.uk, agr.br). Returns None if it cannot be fetched; domain_of then
    falls back to a small built-in heuristic."""
    try:
        text = get(PSL_URL).decode("utf-8")
    except Exception as e:  # noqa: BLE001
        print(f"WARNING: could not fetch public suffix list ({e!r}); using heuristic", file=sys.stderr)
        return None
    text = text.split("// ===END ICANN DOMAINS===")[0]
    rules = set()
    for line in text.splitlines():
        line = line.strip()
        if line and not line.startswith("//"):
            rules.add(line.split()[0])
    return rules


def registrable(labels, psl):
    if psl is None:
        n = 3 if len(labels) >= 3 and len(labels[-1]) == 2 and labels[-2] in SLD else 2
        return ".".join(labels[-n:])
    suffix_len = 1  # default rule "*"
    for i in range(len(labels)):
        cand = ".".join(labels[i:])
        if "!" + cand in psl:
            suffix_len = len(labels) - i - 1
            break
        if cand in psl or (i + 1 < len(labels) and "*." + ".".join(labels[i + 1:]) in psl):
            suffix_len = len(labels) - i
            break
    if len(labels) <= suffix_len:
        return None  # the host is itself a public suffix
    return ".".join(labels[-(suffix_len + 1):])


def domain_of(website, psl=None):
    """Return (domain, reason). domain is None when the row should be dropped."""
    w = re.split(r"[,\s]+", (website or "").strip())[0]  # some rows list two URLs
    if not w or re.fullmatch(r"https?:/*", w):
        return None, "missing"
    if "://" not in w:
        w = "http://" + w
    try:
        u = urllib.parse.urlsplit(w)
        host = (u.hostname or "").lower().strip(".")
    except ValueError:
        return None, "invalid"
    if host.startswith("www."):
        host = host[4:]
    labels = host.split(".")
    if len(labels) < 2 or not re.fullmatch(r"[a-z0-9.-]+", host) or re.fullmatch(r"[0-9.]+", host):
        return None, "invalid"
    has_path = bool(u.path.strip("/")) or bool(u.query)
    for i in range(len(labels) - 1):
        if ".".join(labels[i:]) in GENERIC:
            if i == 0 and not has_path:
                break  # bare root of the host: the company owns it
            return None, "generic"
    dom = registrable(labels, psl)
    return (dom, None) if dom else (None, "invalid")


def batch_code(batch):
    m = re.fullmatch(r"(\w+) (\d{4})", batch or "")
    if not m or m.group(1).lower() not in SEASON:
        return None, None
    return SEASON[m.group(1).lower()] + m.group(2)[2:], int(m.group(2))


def location(all_locations):
    first = (all_locations or "").split(";")[0].strip()
    if not first:
        return None, None
    parts = [p.strip() for p in first.split(",") if p.strip()]
    if parts[-1].lower() == "remote":
        return None, None
    country = COUNTRY_ALIAS.get(parts[-1], parts[-1])
    city = parts[0] if len(parts) > 1 and parts[0].lower() != "remote" else None
    return city, country


def normalize(c):
    code, year = batch_code(c.get("batch"))
    city, country = location(c.get("all_locations"))
    regions = c.get("regions") or []
    region = next((r for r in WORLD_REGIONS if r in regions), None)
    seen, verticals = set(), []
    for v in [c.get("industry")] + (c.get("industries") or []) + (c.get("tags") or []):
        if v and v not in seen:
            seen.add(v)
            verticals.append(v)
    return {
        "company_name": (c.get("name") or "").strip(),
        "domain": None,
        "logo_url": c.get("small_logo_thumb_url") or None,
        "linkedin_url": None,  # not in the public index
        "city": city,
        "country": country,
        "worldregion": REGION_ALIAS.get(region, region),
        "industry_vertical": verticals or None,
        "program_names": [code] if code else [],
        "first_session_year": year,
        "founded_year": None,  # not in the public index
        "is_exit": c.get("status") in ("Acquired", "Public"),
        "is_unicorn": False,  # not in the public index
    }


def sort_key(code):
    return (2000 + int(code[-2:]), SEASON_ORDER.get(code[:-2], 9))


def main():
    if "--mirror" in sys.argv:
        raw, meta = fetch_mirror()
    else:
        try:
            raw, meta = fetch_algolia()
        except Exception as e:  # noqa: BLE001 - any failure falls back to the mirror
            print(f"Algolia failed ({e!r}); falling back to mirror", file=sys.stderr)
            raw, meta = fetch_mirror()

    psl = load_psl()
    dropped = collections.Counter()
    dropped_examples = collections.defaultdict(list)
    by_domain, merged = {}, 0
    for c in sorted(raw, key=lambda c: c["id"]):
        row = normalize(c)
        if not row["program_names"]:
            dropped["no_batch"] += 1
            dropped_examples["no_batch"].append(f'{row["company_name"]}: {c.get("batch")} {c.get("website")}')
            continue
        dom, reason = domain_of(c.get("website"), psl)
        if not dom:
            dropped[reason] += 1
            dropped_examples[reason].append(f'{row["company_name"]}: {c.get("website")}')
            continue
        row["domain"] = dom
        prev = by_domain.get(dom)
        if not prev:
            by_domain[dom] = row
            continue
        merged += 1
        codes = sorted(set(prev["program_names"]) | set(row["program_names"]), key=sort_key)
        keep, other = (prev, row) if sort_key(prev["program_names"][0]) <= sort_key(row["program_names"][0]) else (row, prev)
        keep["program_names"] = codes
        keep["is_exit"] = keep["is_exit"] or other["is_exit"]
        for k, v in other.items():
            if keep.get(k) is None:
                keep[k] = v
        by_domain[dom] = keep

    rows = sorted(by_domain.values(), key=lambda r: (sort_key(r["program_names"][0]), r["domain"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(rows, indent=1, ensure_ascii=False) + "\n")

    years = collections.Counter(r["first_session_year"] for r in rows)
    summary = {
        **{k: v for k, v in meta.items() if k != "batch_facets"},
        "raw_companies": len(raw),
        "dropped": dict(dropped),
        "merged_duplicate_domains": merged,
        "rows_written": len(rows),
        "rows_per_batch_year": dict(sorted(years.items())),
        "is_exit_true": sum(r["is_exit"] for r in rows),
        "dropped_examples": {k: v[:60] for k, v in dropped_examples.items() if k != "missing"},
    }
    print(json.dumps(summary, indent=1, ensure_ascii=False), file=sys.stderr)
    print(f"wrote {len(rows)} rows to {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
