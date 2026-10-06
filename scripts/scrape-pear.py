#!/usr/bin/env python3
"""Scrape the Pear VC portfolio (https://pear.vc/companies/).

Source: the WordPress REST API behind the page,
  https://pear.vc/wp-json/wp/v2/companies?per_page=100&page=N&_embed=wp:term
Each post's `link` is the company website (the "links to" redirect). A handful
of spotlight companies link to a pear.vc detail page instead; for those the
website, LinkedIn and headquarters come from the post's rendered content.
Sector / Pear-investment / current-stage are taxonomies (embedded terms).

The site does NOT tag which portfolio companies went through PearX, so every
row is ["Pear VC portfolio"]; the few companies the https://pear.vc/pearx/
page names with a cohort, e.g. "Known (S25)", also get "PearX S25".

Usage: python3 scripts/scrape-pear.py
Output: data/scraped/pear.json
"""
import html, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scrape_common import fetch, domain_of, dedupe, write  # noqa: E402

API = "https://pear.vc/wp-json/wp/v2/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "scraped", "pear.json")
US_STATE = re.compile(r"^(.*),\s*([A-Z]{2})$")


def text(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def norm(name):
    return re.sub(r"[^a-z0-9]", "", name.lower())


def pearx_cohorts():
    """{normalised company name: 'S25'} from the PearX landing page."""
    try:
        page, _ = fetch("https://pear.vc/pearx/")
    except Exception as e:  # noqa: BLE001
        print(f"pearx page failed: {e}", file=sys.stderr)
        return {}
    body = text(re.sub(r"<script.*?</script>|<style.*?</style>", "", page, flags=re.S))
    return {norm(n): c for n, c in re.findall(r"([A-Z][\w.&-]*(?: [A-Z][\w.&-]*)?) \(([SWF]\d{2})\)", body)}


def main():
    posts, page, total = [], 1, None
    while True:
        body, hdr = fetch(f"{API}companies?per_page=100&page={page}&_embed=wp:term")
        hdr = {k.lower(): v for k, v in hdr.items()}
        total = int(hdr.get("x-wp-total", 0))
        posts += json.loads(body)
        if page >= int(hdr.get("x-wp-totalpages", 1)):
            break
        page += 1

    media = {}
    ids = sorted({p["featured_media"] for p in posts if p.get("featured_media")})
    for i in range(0, len(ids), 100):
        chunk = ",".join(map(str, ids[i:i + 100]))
        try:
            body, _ = fetch(f"{API}media?per_page=100&include={chunk}&_fields=id,source_url")
            media.update({m["id"]: m["source_url"] for m in json.loads(body)})
        except Exception as e:  # noqa: BLE001
            print(f"media lookup failed: {e}", file=sys.stderr)

    cohorts = pearx_cohorts()
    rows, no_site, generic = [], [], []
    for p in posts:
        name = text(p["title"]["rendered"])
        content = p["content"]["rendered"]
        hrefs = [html.unescape(h) for h in re.findall(r'href="([^"]+)"', content)]
        site = p["link"]
        if domain_of(site) is None:  # pear.vc detail page -> first external, non-social link
            site = next((h for h in hrefs if domain_of(h)), None)
        domain = domain_of(site)
        if not domain:
            (generic if site and "pear.vc" not in site else no_site).append(name)
            continue
        terms = {}
        for group in p.get("_embedded", {}).get("wp:term", []):
            for t in group:
                terms.setdefault(t["taxonomy"], []).append(html.unescape(t["name"]))
        stage = terms.get("current-stage-company", [])
        info = {text(k): text(v) for k, v in re.findall(
            r'left-info">(.*?)</div>\s*<div class="right-info">(.*?)</div>', content, flags=re.S)}
        city = country = None
        hq = info.get("Headquarters")
        if hq:
            m = US_STATE.match(hq)
            city, country = (m.group(1), "United States") if m else (hq, None)
        programs = ["Pear VC portfolio"]
        cohort = cohorts.get(norm(name))
        if cohort:
            programs.append(f"PearX {cohort}")
        rows.append({
            "company_name": name, "domain": domain,
            "logo_url": media.get(p.get("featured_media")),
            "linkedin_url": next((h for h in hrefs if "linkedin.com/company/" in h), None),
            "city": city, "country": country,
            "industry_vertical": terms.get("sector-company") or None,
            "program_names": programs,
            "first_session_year": 2000 + int(cohort[1:]) if cohort else None,
            "founded_year": None,
            "is_exit": any(s in ("Acquired", "IPO") for s in stage),
            "is_unicorn": False,
        })
    out = dedupe(rows)
    write(OUT, out)
    print(f"API total: {total}; fetched: {len(posts)}; no website: {len(no_site)} {no_site}; "
          f"generic website: {len(generic)} {generic}; duplicate domains merged: "
          f"{len(rows) - len(out)}; rows written: {len(out)}; "
          f"PearX-tagged: {sum(len(r['program_names']) > 1 for r in out)}")


if __name__ == "__main__":
    main()
