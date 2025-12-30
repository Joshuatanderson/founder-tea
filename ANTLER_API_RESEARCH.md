# Antler Portfolio API Research

## Summary

Antler's portfolio page at `https://www.antler.co/portfolio` displays **1,575 companies** using a Webflow CMS-powered site with server-side pagination.

## Key Findings

### Site Architecture
- **Platform**: Webflow (identified by `data-wf-*` attributes, `cdn.prod.website-files.com` URLs)
- **Site ID**: `68c1084e137e63873a526f0f`
- **Page ID**: `68da2d9e5ec1c9a18ff718c9`
- **No Individual Company Pages**: Returns 404 (e.g., `/portfolio/airalo` doesn't exist)
- **All data is in the listing page** with pagination

### API Discovery

**Weglot Translation API** (from screenshot):
- API Key: `wg_a8e797560831d57d869202482cb9788d2`
- This is for **translation only**, not portfolio data
- Used to serve site in multiple languages (en, pt-br, ko, ar)

**No REST/GraphQL API Found**:
- Tested `https://api.antler.co/graphql` - no response
- No JSON endpoints discovered in HTML
- Data is embedded directly in server-rendered HTML

### Data Access Method: HTML Scraping

**Pagination Pattern**:
```
https://www.antler.co/portfolio?0b933bfd_page={page_number}
```
- Page 1 (default): Companies starting with 0-mission, 12iD, etc.
- Page 2: Companies starting with Airballoon, Aircity, etc.
- Estimated ~32 pages (1575 companies / ~50 per page)

### Data Available Per Company (from HTML)

| Field | Available | Example |
|-------|-----------|---------|
| Company Name | Yes | "Aerial Tools" |
| Description | Yes | "VTOL drones and AI data-driven solution for large solar park inspections" |
| Location | Yes | "Denmark" |
| Industry/Sector | Yes | "Energy and ClimateTech" |
| Year | Yes | "2025" |
| Logo/Image URL | Yes | `cdn.prod.website-files.com/68d622fc073c7e5dead1105e/...` |
| Website | No | Not visible in listing |
| LinkedIn | No | Not visible in listing |

### HTML Structure

Company cards follow this pattern:
```html
<div class="portfolio-card">
  <img src="cdn.prod.website-files.com/.../logo.avif" />
  <div class="name">Company Name</div>
  <div class="description">Description text...</div>
  <div class="location">Country</div>
  <div class="sector">Industry</div>
  <div class="year">2025</div>
</div>
```

## Recommended Approach

### Phase 1: POC (Single Page) - COMPLETE
1. Scrape page 1 with custom scraper
2. Parse HTML to extract company data
3. Validate data structure matches our schema

**Results:**
- 50 companies extracted from page 1
- Field coverage:
  - Domain: 48/50 (96%)
  - Year: 50/50 (100%)
  - Description: 48/50 (96%)

### Phase 2: Validate Completeness - COMPLETE
1. Count total companies across pages
2. Verify pagination boundaries
3. Check for any missing fields

**Findings:**
- 32 total pages (page 33 returns empty)
- 50 companies per page (except last page)
- Page 32 has 26 companies
- Estimated total: 31 * 50 + 26 = 1,576 companies

**3-Page Validation Test Results:**
- 150 companies extracted from 3 pages (50 per page)
- Field coverage:
  - Domain: 144/150 (96%)
  - Year: 150/150 (100%)
  - Description: 141/150 (94%)

### Phase 3: Full Scrape
1. Loop through all pages (1 to 32)
2. Extract and normalize company data
3. Insert into `portfolio_company` table with `source = 'antler'`
4. 2-second delay between requests to avoid rate limiting

## Data Mapping to Our Schema

| Antler Field | Our `portfolio_company` Field |
|--------------|-------------------------------|
| Company Name | `company_name` |
| Description | `description` |
| Location | `location` |
| Industry | `industries` |
| Year | `year` |
| Image URL | `image_url` |
| - | `domain` (not available) |
| - | `program` (not applicable) |
| - | `batch` (not applicable) |
| "antler" | `source` |

## Validation Group

Need to add "Antler" as a validation group for identity verification:
- Name: "Antler"
- Website: "https://www.antler.co"

## Technical Notes

- Rate limiting: Unknown, should add delays between requests
- Caching: Site uses Cloudflare CDN
- JavaScript: Site works without JS (Webflow SSR)
- Estimated total pages: ~32 (1575 companies / 50 per page)
