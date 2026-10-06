#!/usr/bin/env python3
"""Alchemist Accelerator portfolio -> data/scraped/alchemist.json

Source: the "vault" JSON:API behind https://www.alchemistaccelerator.com/portfolio
  list:   https://vault.alchemistaccelerator.com/api/v1/alchemist_companies?include=aclass,tags&filter[aclass.class_type:eq]=alchemist&page[size]=50&page[number]=N
  detail: https://vault.alchemistaccelerator.com/api/v1/companies/<slug>   (attributes.website, linkedin, founded)
          (detail by numeric id is 403; by slug is public)
Run: python3 scripts/scrape-alchemist.py
"""
import json, os, sys, re
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from portfolio_util import fetch, to_domain, row, write

B = "https://vault.alchemistaccelerator.com/api/v1/"
V = "https://vault.alchemistaccelerator.com/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "scraped", "alchemist.json")
EXIT_STATUSES = {"acquired", "ipo", "public", "exited"}

def detail(c):
    slug = (c.get("meta") or {}).get("slug")
    if not slug:
        return {}
    try:
        return json.loads(fetch(B + "companies/" + slug))["data"]["attributes"]
    except Exception:
        return {}

def logo_url(p):
    """Mirror of getCompanyLogo() in the portfolio page script."""
    if not p:
        return None
    if "http" in p:
        return p
    if "upload" in p:
        return V + p.lstrip("/")
    ext = p.rsplit(".", 1)[-1].lower()
    return V + "upload/" + (p if ext in ("jpg", "jpeg", "png", "bmp", "gif", "tiff") else p + ".png")

def year(v):
    m = re.search(r"(19|20)\d\d", str(v or ""))
    return int(m.group(0)) if m else None

def main():
    items, tags, classes, total, n = [], {}, {}, None, 1
    while True:
        d = json.loads(fetch(B + "alchemist_companies?include=aclass,tags&filter%5Baclass.class_type:eq%5D=alchemist"
                             f"&page%5Bsize%5D=50&page%5Bnumber%5D={n}"))
        total = d["meta"]["results"]["available"]
        for inc in d.get("included", []):
            if inc["type"] == "tags":
                tags[inc["id"]] = inc["attributes"]["text"]
            elif inc["type"] == "alchemist_classes":
                classes[inc["id"]] = inc["attributes"]
        items += d["data"]
        if not d["data"] or len(items) >= total:
            break
        n += 1
    with ThreadPoolExecutor(6) as ex:
        details = list(ex.map(detail, items))
    rows, dropped, statuses = [], 0, {}
    for c, a in zip(items, details):
        m = c.get("meta") or {}
        statuses[m.get("status")] = statuses.get(m.get("status"), 0) + 1
        dom = to_domain(a.get("website"))
        if not dom:
            dropped += 1
            continue
        loc = [p.strip() for p in (m.get("location_formatted_address") or "").split(",") if p.strip()]
        rel = c.get("relationships") or {}
        cls = classes.get(((rel.get("aclass") or {}).get("data") or {}).get("id")) or {}
        num = cls.get("number") or m.get("aclass_id")
        verts = [tags[t["id"]] for t in ((rel.get("tags") or {}).get("data") or []) if t["id"] in tags]
        logo = m.get("logo")
        rows.append(row(
            c["attributes"]["name"], dom,
            logo_url(logo),
            a.get("linkedin"),
            loc[0] if len(loc) > 1 else None,
            (loc[-1] if loc else None) or a.get("incorporation_country"),
            verts, [f"Class {num}"] if num else [],
            year(cls.get("date_time_from")), year(a.get("founded")),
            is_exit=(m.get("status") or "").lower() in EXIT_STATUSES))
    print("  statuses:", statuses)
    write(OUT, rows, total, dropped)

if __name__ == "__main__":
    main()
