# Techstars API Reverse Engineering Research

## Objective
Scrape all Techstars portfolio companies by reverse engineering their public API.

---

## Initial Observations

### Data Source: Apify Scraper Output
From the Apify scraper page, we know these fields are available:
- `company_image` - URL to company logo
- `company_name` - Company name
- `description` - Company description
- `location` - City, State, Country
- `accelerator_year` - Year (e.g., "2013")
- `accelerator_program` - Program name (e.g., "Techstars Chicago Accelerator")
- `tags` - Array of industry verticals (e.g., ["Big Data", "Fintech"])
- `website` - Company website URL
- `company_linkedin` - LinkedIn URL
- `company_crunchbase` - Crunchbase URL
- `company_x` - Twitter/X URL
- `company_facebook` - Facebook URL

### Image URL Patterns Discovered
Two distinct image hosting patterns:

1. **Salesforce-backed images:**
   ```
   http://apimg.techstars.com/sf/accounts/logo/Logo_[ID].jpg
   ```
   - The `/sf/` path strongly suggests **Salesforce** as the backend
   - Example: `Logo_4e0fc4dad222d61ef32e5f9b1.jpg`

2. **Connect system images:**
   ```
   https://apimg.techstars.com/connect/images/image_files/[ID]/original/[filename]
   ```
   - Appears to be a separate "Connect" system
   - Example: `57b35f31bbe36f877200002e/original/icon_250x250.png`

---

## Hypotheses

### Hypothesis 1: Salesforce Experience Cloud API
**Confidence: HIGH (70%)**

Evidence:
- `/sf/accounts/` path in image URLs = Salesforce Account object
- Techstars is known to use Salesforce for CRM
- The "Connect" subdirectory might be Salesforce Communities/Experience Cloud

Potential endpoints to test:
- `https://techstars.my.salesforce.com/services/apexrest/`
- `https://techstars.my.salesforce-sites.com/`
- Look for Salesforce Community/Experience Cloud public APIs

### Hypothesis 2: Custom REST API
**Confidence: MEDIUM (50%)**

The portfolio page likely calls a backend API. Common patterns:
- `https://www.techstars.com/api/portfolio`
- `https://www.techstars.com/api/companies`
- `https://api.techstars.com/v1/portfolio`
- `https://www.techstars.com/_next/data/` (if Next.js)

### Hypothesis 3: GraphQL API
**Confidence: LOW-MEDIUM (30%)**

Modern sites often use GraphQL:
- `https://www.techstars.com/graphql`
- `https://api.techstars.com/graphql`

### Hypothesis 4: Server-Side Rendered (No Public API)
**Confidence: MEDIUM (40%)**

The page may be fully SSR with no exposed API. Evidence:
- reCAPTCHA is present on the page (anti-bot protection)
- Pagination might require captcha solving

---

## Filter Parameters (From Page Analysis)

The portfolio page supports these filters (useful for API params):

### Special Filters
- `$1B+ companies` (22 total)
- `In program now` (0 currently)
- `Exits (Acquired/IPOs)` (573 total)
- `B Corp` (31 total)

### Industry Verticals (partial list)
| Vertical | Count |
|----------|-------|
| AI/ML | 1,577 |
| Mobile | 1,204 |
| Fintech | 1,054 |
| Big Data | 302 |
| Cleantech | 345 |
| Climate tech | 353 |
| Cryptocurrency/Blockchain | 283 |
| And many more... | |

### Regions
- Africa (88)
- Americas (3,699)
- Asia (142)
- Europe (886)
- Middle East (159)
- Oceania (73)

### Year Range
- 2007 to 2025

### Total Companies
**5,048 companies** listed on the portfolio page

---

## Testing Plan

1. **Browser DevTools inspection** - Check Network tab for XHR/Fetch calls
2. **Probe common API endpoints** with curl
3. **Check for sitemap.xml** - May list all company pages
4. **Inspect JavaScript bundles** - May reveal API endpoints
5. **Test Salesforce public APIs** if hypothesis 1 confirmed

---

## Anti-Scraping Measures Observed
- Google reCAPTCHA Enterprise present on page
- May have rate limiting
- CloudFlare or similar CDN protection possible

---

## Next Steps
- [ ] Test Hypothesis 2 endpoints with curl
- [ ] Look for `_next/data` or similar SSR data endpoints
- [ ] Check for public Salesforce Community API
- [ ] Inspect page source for embedded JSON data or API calls
- [ ] Map URL parameter patterns (e.g., `?industry_vertical=Big+Data`)
