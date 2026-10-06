#!/usr/bin/env python3
"""Scrape Entrepreneurs Roundtable Accelerator (ERA, New York) alumni.

Source: https://www.eranyc.com/companies/ -- one server-rendered page holding
every company as an <article class="companies-cell"> card (no API, no paging).

Usage: python3 scripts/scrape-era.py [--email-fallback]
  --email-fallback  when a card has no Website link, use the domain of its
                    (Cloudflare-obfuscated) contact e-mail instead of dropping it.
Output: data/scraped/era.json
"""
import html, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scrape_common import fetch, domain_of, dedupe, write  # noqa: E402

URL = "https://www.eranyc.com/companies/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "scraped", "era.json")


def text(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def cf_email(hexstr):
    b = bytes.fromhex(hexstr)
    return "".join(chr(c ^ b[0]) for c in b[1:])


def main():
    fallback = "--email-fallback" in sys.argv
    page, _ = fetch(URL)
    cards = re.findall(r'<article class="companies-cell.*?</article>', page, flags=re.S)
    rows, no_site, generic, via_email = [], 0, 0, 0
    for c in cards:
        name = text(re.search(r'panel__headline">(.*?)</h2>', c, flags=re.S).group(1))
        links = [(html.unescape(h), text(t).lower())
                 for h, t in re.findall(r'<a[^>]+href="([^"]*)"[^>]*>(.*?)</a>', c, flags=re.S)]
        site = next((h for h, t in links if t == "website"), None)
        linkedin = next((h for h, t in links if "linkedin.com" in h), None)
        domain = domain_of(site)
        if not domain:
            if site:
                generic += 1
            else:
                no_site += 1
            if fallback:
                for hx in re.findall(r'data-cfemail="([0-9a-f]+)"', c):
                    domain = domain_of(cf_email(hx).split("@")[-1])
                    if domain:
                        via_email += 1
                        break
            if not domain:
                continue
        prog = re.search(r'panel__program">(.*?)</span>', c, flags=re.S)
        prog = re.sub(r"^Current Companies\s*", "", text(prog.group(1))) if prog else ""
        year = re.search(r"(20\d{2})", prog)
        cats = [text(x) for x in re.findall(r'panel__category">(.*?)</span>', c, flags=re.S)]
        logo = re.search(r"companies-cell__img\"[^>]*url\('([^']+)'\)", c)
        rows.append({
            "company_name": name, "domain": domain,
            "logo_url": logo.group(1) if logo else None,
            "linkedin_url": linkedin, "city": None, "country": None,
            "industry_vertical": [x for x in cats if x] or None,
            "program_names": [f"ERA {prog}"] if prog else ["ERA"],
            "first_session_year": int(year.group(1)) if year else None,
            "founded_year": None, "is_exit": False, "is_unicorn": False,
        })
    out = dedupe(rows)
    write(OUT, out)
    print(f"cards on page: {len(cards)}; no website link: {no_site}; generic/invalid website: "
          f"{generic}; recovered via e-mail: {via_email}; duplicate domains merged: "
          f"{len(rows) - len(out)}; rows written: {len(out)}")


if __name__ == "__main__":
    main()
