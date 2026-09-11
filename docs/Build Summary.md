# Where My Ward's Money Goes — Build Summary

**Team Somehow We Manage · CREATE 2026 · 11 September 2026**
Live: https://somehow-we-manage.netlify.app · Repo: https://github.com/mayur2299/somehow_we_manage

---

## One line

Your ward's budget, what was actually spent, and one tap to ask the BMC why.

## The problem

The BMC spends about ₹74,000 crore a year. Ward-level spending is never published. The budget is
1,000+ pages of PDF organised by department, not by neighbourhood. The share of the budget reaching
wards fell from 18% to 11% in five years while the total nearly doubled. From March 2022 to January
2026 there was no elected council at all — an administrator approved everything.

A resident who wants to know what their ward spent on drains has to file an RTI and do the maths.

## What we built

Enter a Mumbai PIN code. Land on your ward. See five things, act on any of them. No login anywhere.

### 1. PIN → ward
- **88 Mumbai pincodes mapped to all 24 BMC wards.** Typing 400050 lands on H/West Bandra, 400080
  on T Mulund, 400069 on K/East Andheri.
- Reveal screen, then the ward dashboard. PIN is remembered locally, changeable from the nav.

### 2. Money received vs money spent
- Allotted vs actual spend, year by year, 2021-22 to 2025-26, with utilisation %.
  K/East: given ₹321 cr in 2023-24, spent ₹546 cr — 170%.
- Per-resident spend against the Mumbai average, property tax collected vs spent on running the ward.
- Every number in one table, colour-coded, collapsed by default.
- The last two years carry **no actuals** because the BMC has not closed them. The page says so
  rather than inventing numbers.

### 3. Split by department
Six services residents actually feel: garbage, roads, storm water drains, health, parks, markets.
Each with allotted vs spent, three-year utilisation, cost per resident, comparison to Mumbai, and a
physical fact (133 km of roads, 174 km of drains, 24 dispensaries, 313 tonnes of garbage a day).
K/East drains ran at **519%** of budget. Health at 346%.

### 4. The forum — a ward group chat
- **WhatsApp-style chat**, one column, day separators, composer at the bottom.
- Pinned message at the top is what the BMC spent. Everything under it is what residents see.
- Post a complaint: service tag, problem tag (not started / half done / poor quality / abandoned /
  never existed), headline, location, photo. Photo is compressed in the browser.
- On every message: **Me too** (a running "N people say this is still here" count with last-seen
  date), **Upvote**, threaded replies, **Share this**, **Report**, and a petition strip.
- Channels per service, filters by problem type, sort by newest / most me-too / most discussed.
- Separate **r/mumbai** tab pulling public Reddit threads about the area, cached hourly with a
  snapshot fallback.
- Permalinks per post, so a shared link opens on that complaint.
- **Seeded with 21 real-looking complaints for K/East** across all six services, 12 with photos from
  Wikimedia Commons (credited), at real Andheri locations: Marol Maroshi Road, Sakinaka Junction,
  Chakala, JB Nagar, Saki Vihar, Mahakali Caves Road, Gundavali, Sahar Village, Kondivita.

### 5. Petitions
- Raise one **directly from any complaint**, pre-filled with that complaint's text, location and the
  ward's own spend figures.
- Sign in place from the chat, or open the petition's own page.
- **`/petitions`** — all petitions for the ward, grouped by service, each group headed with that
  service's spend and utilisation.
- **`/petitions/[id]`** — signature count, the ask, the ward's spend for context, a three-step status
  timeline (collecting → sent to ward office → answered), link back to the originating complaint, and
  share buttons with a next signature milestone.

### 6. Ask the BMC (RTI)
A ready-to-file Right to Information application, already filled with the ward, service, allotted and
actual figures for the last three closed years. Four numbered questions covering works, contractors,
completion dates, reasons for the variance, penalties for delay, and inspection reports. Copy,
download, or open the Maharashtra RTI Online portal. We generate it; the citizen files it.

### 7. The Receipt — the viral object
A canvas-generated share card in three sizes (1:1 for WhatsApp and Instagram, 9:16 story, 16:9 for X
and LinkedIn). It uses a resident's photo as the background, the real spend, the utilisation, the
complaint count, and a punchline that scales with the number. Every card ends with
**"Is your ward any better? → Check your PIN code"**. Shareable from a service card or from a single
post, in which case the card is about *that* complaint.

### 8. Who represents you
15 corporators for K/East elected 16 January 2026, with party as plain text and a "Declared" link to
each candidate's own election affidavit on MyNeta. Ward office address and phone. MLAs and the Mayor.
A highlighted card for the four years with no elected council. Wards where we could not verify the
corporator list say so instead of guessing.

### 9. Honesty, built in
- A red **"Known gaps"** card per ward listing exactly what is not verified.
- "Utilisation above 100% does not automatically mean fraud" is stated on the page.
- A dark **"What the BMC does not publish"** section: project lists, contractor delays, penalties,
  recent ward actuals.
- Six of K/East's electoral wards moved to the new K/North office in Feb 2026; the page notes it.

---

## Data

| Source | Used for |
|---|---|
| Praja Foundation, *Report on Ward-wise Budget in Mumbai 2025* | Ward actuals for all 24 wards, Tables 3–14, obtained by Praja under RTI, extracted programmatically with pdfplumber |
| BMC Budget Estimates via OpenCity | City-level figures and context |
| OpenCity, *BMC Election Results 2026* CSV | Corporators, 227 electoral wards |
| Free Press Journal, *Know Your Ward* series | Electoral ward ranges per administrative ward |
| Wikimedia Commons API | Complaint photos, openly licensed, credited on each card |
| Reddit public search (r/mumbai) | Neighbourhood threads, cached, snapshot fallback |
| India Post localities | 88-pincode → ward map (compiled by us) |

All open, all cited on the page, all static at deploy time. Nothing breaks after the submission freeze.

## Stack

Nuxt 4 for frontend and backend in one app. Netlify hosting, with `server/api/*` deployed as Netlify
Functions. Netlify Blobs for complaints, comments, petitions and cache. Plain CSS charts — no chart
library. Canvas for the share cards. **No AI, no API keys, no paid service, no login, no database.**

### Routes
- `/` — PIN gate → ward dashboard
- `/forum` — the ward group chat
- `/petitions` and `/petitions/[id]`
- 13 API endpoints: flags (list, post, like, confirm, comments, report), petitions (list, get, post,
  sign), threads, image proxy, health

## Design system

Newspaper infographic × civic poster × meme page. Paper `#F4EFDF` and ink `#111`, 3px black borders,
hard offset shadows, Archivo Black headlines with tight tracking, Inter for body. Colours mean data
states only — blue allotted, pink spent, purple estimate, red needs explanation — **never political
parties**. Humour targets bureaucracy and absurd numbers, never residents or individuals.

## What is a prototype, honestly

- Complaints for K/East are seeded to demonstrate the loop. Real posts from visitors save alongside them.
- The RTI is generated for the citizen to file, not filed on their behalf. No public filing API exists.
- Petition status is manual; nothing is actually delivered to the ward office yet.
- Pincode-to-ward map is curated by us and best-effort at the boundaries.

## Judge questions to expect

- **"How can a ward spend 519% of its budget?"** BMC ward budgets are notional; actuals include
  central department spend booked to the ward. That mismatch is itself the finding, and it is exactly
  what the RTI asks about.
- **"Is the data current?"** The most recent *closed* actuals are 2023-24, for every ward in Mumbai.
  That two-year lag is the transparency gap, not a gap in our work.
- **"What is new here?"** Praja's report is a static annual PDF. MyNagarSevak and Mumbai Civic Tracker
  route complaints but never show money. The BMC portal shows departments, not wards. Nobody connects
  allocation → actual spend → a resident's photo → a petition → an RTI in one place, at ward level.

## Close

The BMC is called the richest municipal corporation in the country. Every Mumbai resident pays for
their ward. This is the first time they can see what they got for it — and ask when they did not.
