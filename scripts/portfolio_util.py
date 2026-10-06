"""Helpers for scrape-a16z-speedrun.py and scrape-alchemist.py (stdlib only).
Kept separate from scrape_common.py, which belongs to the other scrapers in this directory."""
import json, re, time, urllib.request, urllib.parse

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
# Shared platforms, not a company's own email domain.
GENERIC_HOSTS = set("""linkedin.com twitter.com x.com facebook.com fb.com instagram.com github.com github.io
apple.com play.google.com google.com steampowered.com notion.site notion.so linktr.ee youtube.com youtu.be t.me
discord.gg discord.com medium.com substack.com tiktok.com bit.ly forms.gle calendly.com angel.co wellfound.com
crunchbase.com producthunt.com itch.io roblox.com epicgames.com webflow.io carrd.co wixsite.com typeform.com
airtable.com vercel.app netlify.app herokuapp.com framer.website framer.app super.site amazon.com myshopify.com
gumroad.com patreon.com kickstarter.com huggingface.co tinyurl.com lnkd.in beacons.ai""".split())

def fetch(url, retries=4):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode("utf-8", "replace")
        except Exception:
            if i == retries - 1:
                raise
            time.sleep(2 * (i + 1))

def to_domain(url):
    """Bare lowercase host, or None if missing/invalid/generic shared host."""
    u = (url or "").strip() if isinstance(url, str) else ""
    if not u:
        return None
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", u):
        u = "http://" + u
    try:
        host = (urllib.parse.urlsplit(u).hostname or "").lower().strip(".")
    except ValueError:
        return None
    host = re.sub(r"^www\d*\.", "", host)
    if not re.match(r"^([a-z0-9-]+\.)+[a-z]{2,}$", host):
        return None
    if any(host == g or host.endswith("." + g) for g in GENERIC_HOSTS):
        return None
    return host

def clean(s):
    s = str(s).strip() if s is not None else ""
    return s or None

def row(company_name, domain, logo_url=None, linkedin_url=None, city=None, country=None,
        industry_vertical=None, program_names=None, first_session_year=None, founded_year=None,
        is_exit=False, is_unicorn=False):
    return {"company_name": clean(company_name), "domain": domain, "logo_url": clean(logo_url),
            "linkedin_url": clean(linkedin_url), "city": clean(city), "country": clean(country),
            "industry_vertical": [x for x in (industry_vertical or []) if x] or None,
            "program_names": [x for x in (program_names or []) if x],
            "first_session_year": first_session_year, "founded_year": founded_year,
            "is_exit": bool(is_exit), "is_unicorn": bool(is_unicorn)}

def write(path, rows, total=None, dropped=0):
    """Dedupe by domain (merging program_names and filling nulls), write, print a summary."""
    out, dupes = {}, 0
    for r in rows:
        o = out.setdefault(r["domain"], r)
        if o is not r:
            dupes += 1
            o["program_names"] += [p for p in r["program_names"] if p not in o["program_names"]]
            for k, v in r.items():
                if o[k] is None:
                    o[k] = v
    res = sorted(out.values(), key=lambda r: (r["company_name"] or "").lower())
    with open(path, "w") as f:
        json.dump(res, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"{os.path.basename(path)}: site_total={total} written={len(res)} dropped_no_or_generic_website={dropped} merged_duplicate_domains={dupes}")

import os
