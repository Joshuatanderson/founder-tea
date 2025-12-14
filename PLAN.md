# Founder Tea - Implementation Plan

## Phase 1: Visual Homepage (Current)

### Goal
Create a compelling landing page that communicates the value prop: anonymous, verified founder reviews of VCs.

### Homepage Sections

1. **Hero**
   - Headline: Anonymous VC reviews from verified founders
   - Subhead: Share your experience. Protect your identity.
   - CTA: "Find a VC" / "Submit a Report"

   **Ambiguity/Concerns:**
   - Do we show both CTAs equally or prioritize one?
   - Should we require group verification before browsing, or allow anonymous browsing?

2. **How It Works**
   - Step 1: Verify your accelerator email
   - Step 2: Generate your anonymous credential
   - Step 3: Submit reports that can never be traced back

   **Ambiguity/Concerns:**
   - How much do we explain ZK proofs? Too technical = confusing, too simple = doesn't build trust
   - Do we need a "Why trust this?" section?

3. **Recent Reports Preview**
   - Show anonymized recent activity: "A YC founder reported [VC] for ghosting"
   - Aggregate stats: "127 reports from 3 accelerators"

   **Ambiguity/Concerns:**
   - What's the minimum report count before we show a VC publicly?
   - How do we handle the cold start problem (no reports yet)?

4. **Accelerator Badges**
   - Show supported accelerators (YC, Techstars, Antler, etc.)
   - "Your program not listed? Request it"

   **Ambiguity/Concerns:**
   - How do we verify new accelerator requests?
   - What's the minimum portfolio size to support a group?

5. **Footer**
   - FAQ link
   - Privacy policy
   - "How we protect you" technical explainer

---

## Phase 2: Core Database & Auth

### Tables to Create

#### `group` (Accelerator Programs)
```sql
CREATE TABLE group (...)
```
**Ambiguity/Concerns:**
- "group" is a reserved word in SQL - need to quote it or rename to `accelerator`?
- How do we handle accelerator batches? (YC W24 vs YC S24) - same group or separate?
- What about accelerators with multiple programs? (Techstars NYC vs Techstars Boston)

#### `group_membership` (Verified Domains)
```sql
CREATE TABLE group_membership (...)
```
**Ambiguity/Concerns:**
- How do we populate initial domain lists? Manual scraping? Partnership with accelerators?
- What about founders who used personal email during accelerator?
- Domain changes: company pivots, acquisitions - how do we keep this current?
- Some YC companies share domains (acquired startups) - false positives?

#### `credential` (Semaphore Commitments)
```sql
CREATE TABLE credential (...)
```
**Ambiguity/Concerns:**
- Merkle tree rebuild performance at scale (10k+ members)?
- What if someone loses their identity secret? No recovery possible by design, but UX concern
- Should we store any metadata (created_at is fine, but what about "last_used")?
- Multiple credentials per domain allowed? (co-founders from same company)

#### `vc` (VC Firms)
```sql
CREATE TABLE vc (...)
```
**Ambiguity/Concerns:**
- How do we seed the initial VC list? Crunchbase API? Manual?
- VC firm name changes, mergers, spin-offs - how do we handle?
- Individual partners vs firms: v1 is firms only, but data model implications?
- What about angels, family offices, CVCs? Scope creep risk

#### `tag` (Report Categories)
```sql
CREATE TABLE tag (...)
```
**Ambiguity/Concerns:**
- Who defines tags? Admin-only or community suggestions?
- Tag taxonomy: flat list or hierarchical?
- Sentiment field: is 3-value (pos/neg/neutral) enough?
- What are the initial tags? Need to define before launch:
  - Negative: ghosting, exploding offers, reputation damage, broken promises, slow process
  - Positive: helpful intros, founder-friendly terms, fast decisions, good advice
  - Neutral: standard terms, normal timeline

#### `message` (Reports)
```sql
CREATE TABLE message (...)
```
**Ambiguity/Concerns:**
- `tag_ids UUID[]` - array type vs junction table? Arrays simpler but harder to query
- Free text moderation: how do we prevent doxxing, libel, or abuse?
- Severity 1-5: what do the levels mean? Need clear definitions
- Should reports have a "verified" status? Or all reports equal?
- Edit/delete: once submitted, immutable? Or allow updates with same nullifier?
- Report aging: do old reports decay in relevance?

---

## Phase 3: Email Verification Flow

### Flow
1. User enters work email
2. Backend checks domain against `group_membership`
3. Send 6-digit code (expires in 10 min)
4. User enters code
5. Client generates Semaphore identity
6. Backend stores only commitment hash
7. Email deleted from memory (never persisted)

**Ambiguity/Concerns:**
- Email service: Resend? SendGrid? Postmark?
- Rate limiting: how many verification attempts per email/IP?
- What if email is in multiple groups? (founder did YC then Techstars)
- Temporary email detection needed?
- What's the "email deleted" guarantee? Logs, error tracking, etc.?

---

## Phase 4: ZK Proof System

### Client-Side
- Generate Semaphore identity from user secret
- Compute commitment hash
- Generate ZK proof for report submission

### Server-Side
- Rebuild Merkle tree from credentials
- Verify proof against tree
- Check nullifier uniqueness
- Store report (no link to prover)

**Ambiguity/Concerns:**
- Semaphore v3 vs v4? Library stability?
- Client-side proof generation time: acceptable UX?
- Browser compatibility for WASM-based proving?
- Mobile support?
- What if Semaphore library has vulnerabilities? Upgrade path?

---

## Phase 5: VC Profile Pages

### Components
- VC header (name, logo, website)
- Aggregate stats (report count, average severity, top tags)
- Tag breakdown chart
- Individual reports (anonymized)
- "Submit Report" CTA

**Ambiguity/Concerns:**
- Minimum reports to show profile? (Avoid single-report witch hunts)
- How do we display severity? Stars? Color coding?
- Report ordering: chronological? By severity? By helpfulness votes?
- Do VCs see their own page differently?

---

## Phase 6: Search & Discovery

### Features
- Search VCs by name
- Filter by tags
- Filter by accelerator (reports from YC founders only)
- Sort by report count, severity, recency

**Ambiguity/Concerns:**
- Full-text search: Postgres built-in vs external (Algolia, Typesense)?
- SEO implications: do we want VC pages indexed?
- How do we handle "no results" for VCs without reports?

---

## Future Phases (Post-v1)

### VC Claiming & Responses
**Ambiguity/Concerns:**
- Verification method: firm email domain?
- What can VCs do? Respond to categories, not individual reports
- Can VCs dispute/flag reports? Moderation implications
- Do VC responses affect report visibility?

### Individual Partner Tracking
**Ambiguity/Concerns:**
- Partners move between firms - identity continuity?
- How do we attribute reports to partners vs firms?
- Privacy implications for named individuals?

### Tighter Founder Verification
**Ambiguity/Concerns:**
- How do we verify "co-founder" vs "employee at YC company"?
- LinkedIn integration? Cap table verification?
- Does tighter verification reduce anonymity?

---

## Open Questions (Need Answers Before Building)

1. **Cold Start**: How do we launch with zero reports? Seed data? Private beta?

2. **Moderation**: Who reviews reports for abuse? Automated? Manual? Community?

3. **Legal**: Defamation liability? Terms of service? GDPR implications?

4. **Trust**: How do we prove the system works without revealing internals?

5. **Abuse Vectors**:
   - Coordinated attacks on specific VCs?
   - Fake accelerator domains?
   - Sybil attacks (multiple credentials per person)?

6. **Business Model**: How does this sustain itself? Donations? VC subscriptions?

---

## Immediate Next Steps

### Homepage Implementation
1. [ ] Set up page layout with shadcn components
2. [ ] Design hero section
3. [ ] Create "How it works" component
4. [ ] Build accelerator badge display
5. [ ] Add placeholder stats/reports section
6. [ ] Style with fuchsia/stone theme

### Assets Needed
- Logo/wordmark
- Accelerator logos (or text-only to start)
- Illustration style decision
