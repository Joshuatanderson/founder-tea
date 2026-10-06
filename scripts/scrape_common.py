"""Shared helpers for the accelerator portfolio scrapers (stdlib only)."""
import json, re, sys, time, urllib.request
from urllib.parse import urlparse

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# Hosts that many companies share: not usable as a company email domain.
GENERIC = {
    "linkedin.com", "twitter.com", "x.com", "facebook.com", "fb.com", "instagram.com",
    "github.com", "github.io", "apple.com", "google.com", "goo.gl", "youtube.com",
    "youtu.be", "tiktok.com", "medium.com", "substack.com", "notion.site", "notion.so",
    "linktr.ee", "bit.ly", "t.co", "angel.co", "wellfound.com", "crunchbase.com",
    "producthunt.com", "webflow.io", "wixsite.com", "wix.com", "squarespace.com",
    "carrd.co", "herokuapp.com", "vercel.app", "netlify.app", "typeform.com",
    "calendly.com", "shopify.com", "myshopify.com", "amazon.com", "etsy.com",
    "kickstarter.com", "indiegogo.com", "wordpress.com", "blogspot.com", "tumblr.com",
    "discord.gg", "discord.com", "t.me", "chrome.google.com", "eranyc.com", "pear.vc",
    # free mail (only relevant to the optional e-mail fallback)
    "gmail.com", "googlemail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "icloud.com", "me.com", "aol.com", "protonmail.com", "proton.me",
}

KEYS = ["company_name", "domain", "logo_url", "linkedin_url", "city", "country",
        "industry_vertical", "program_names", "first_session_year", "founded_year",
        "is_exit", "is_unicorn"]


def fetch(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode("utf-8", "replace"), dict(r.headers)
        except Exception as e:  # noqa: BLE001
            if i == retries - 1:
                raise
            print(f"retry {url}: {e}", file=sys.stderr)
            time.sleep(2 * (i + 1))


def is_generic(host):
    return any(host == g or host.endswith("." + g) for g in GENERIC)


def domain_of(url):
    """Bare lowercase host, or None when missing / malformed / generic."""
    if not url:
        return None
    url = url.strip()
    if not re.match(r"^[a-z][a-z0-9+.-]*://", url, re.I):
        url = "http://" + url
    host = (urlparse(url).hostname or "").lower().strip(".")
    host = re.sub(r"^www\d?\.", "", host)
    if not re.fullmatch(r"[a-z0-9-]+(\.[a-z0-9-]+)+", host) or is_generic(host):
        return None
    return host


def dedupe(rows):
    """Merge rows sharing a domain: first row wins, lists are unioned."""
    out = {}
    for r in rows:
        k = r["domain"]
        if k not in out:
            out[k] = r
            continue
        o = out[k]
        for f in ("program_names", "industry_vertical"):
            merged = list(dict.fromkeys((o[f] or []) + (r[f] or [])))
            o[f] = merged or None
        for f in ("logo_url", "linkedin_url", "city", "country", "founded_year"):
            o[f] = o[f] or r[f]
        years = [y for y in (o["first_session_year"], r["first_session_year"]) if y]
        o["first_session_year"] = min(years) if years else None
        o["is_exit"] = o["is_exit"] or r["is_exit"]
        o["is_unicorn"] = o["is_unicorn"] or r["is_unicorn"]
    return list(out.values())


def write(path, rows):
    rows = [{k: r.get(k) for k in KEYS} for r in rows]
    with open(path, "w") as f:
        json.dump(rows, f, indent=2, ensure_ascii=False)
        f.write("\n")
