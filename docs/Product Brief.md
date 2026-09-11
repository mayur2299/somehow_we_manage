# Where My Ward's Money Goes

**Team:** Somehow We Manage · CREATE 2026 · 11 September 2026
**Pilot ward:** K/East (Andheri East, Marol, Sakinaka, Chakala, Vile Parle East, Jogeshwari East)

## One line
Your ward's budget, what was actually spent, and one tap to ask the BMC why.

## The problem
- BMC spends ~₹74,000 crore a year. Ward-level spending is never published.
- The budget is 1,000+ pages of PDF by department, not by neighbourhood.
- Share of budget reaching wards fell from 18% to 11% in five years while the total nearly doubled.
- March 2022 to January 2026: no elected council. An administrator approved all of it.
- Today, finding out what your ward spent on drains means filing an RTI and doing the maths.

## What the product does
1. **Enter your pincode** → lands on your ward.
2. **Allotted vs actually spent**, year by year, with utilisation %.
   K/East: given ₹321 cr in 2023-24, spent ₹546 cr (170%).
3. **Where it went**: garbage, roads, drains, health, parks, markets.
   Each with allotted vs spent, cost per resident, comparison to Mumbai. Drains ran at 519%.
4. **Every number**, in one table, colour-coded.
5. **Who is accountable today**: 15 corporators elected Jan 2026 (party split), ward office, MLAs, Mayor,
   plus the four administrator years with no elected oversight.
6. **Two actions on every service**
   - **Flag it**: "budgeted but I don't see it" — pick service tag + problem tag (Not started, Half done,
     Poor quality, Abandoned, Never existed), add a note and photo. Stored, counted publicly.
   - **Ask the BMC**: pre-filled RTI application with the exact figures. Copy or download. 30-day legal deadline.
7. **What the BMC does not publish**: works, contractors, delays, penalties. Stated plainly.

## Data
- Praja Foundation, Report on Ward-wise Budget in Mumbai 2025 — ward actuals obtained under RTI, extracted
  programmatically from the PDF tables (Tables 3–14).
- BMC Budget Estimates via OpenCity — city-level figures.
- BMC Election Results 2026 (OpenCity CSV) — corporators.
- All open, cited on the page, static. Nothing breaks after the deadline freeze.

## Honesty built in
- Spend closes two years after allocation. 2024-25 and 2025-26 show allotments only, labelled "estimate".
- Utilisation over 100% means the ward spent more than allotted (central departments booking to the ward).
- Six of K/East's electoral wards moved to the new K/North office in Feb 2026. Figures are for undivided K/East.
- No projected numbers appear in the RTI text.

## Why it is new
- Praja's report is a static annual PDF.
- MyNagarSevak / Mumbai Civic Tracker route complaints, never show money.
- BMC portal shows departments, not wards.
- Nobody connects allocation → actual spend → citizen action at ward level.

## The hard part
Turning an unpublished, RTI-sourced dataset locked in PDFs into a per-ward drill-down, and closing the loop
so a number on screen becomes a legal question the BMC must answer.

## Stack
Nuxt 4 (frontend + API), Netlify (hosting + Blobs for flags), plain CSS charts. No AI, no keys, nothing paid.

## Demo flow (under 2 minutes)
1. Type pincode 400059 → K/East.
2. Hook: 18% → 11%. Headline: ₹321 cr given, ₹546 cr spent.
3. Chart: point at the estimate-only years.
4. Tap Storm water drains: 519%.
5. Flag it: Roads · Poor quality · note · photo. Count appears.
6. Ask the BMC: RTI filled with real figures. Copy.
7. Who is accountable: four years, no council.
8. Close: "Every Mumbai resident pays for their ward. This is the first time they can see what they got for
   it, and ask when they did not."

## Judge questions to expect
- "How can a ward spend 519% of its budget?" → BMC ward budgets are notional; actuals include central
  department spend booked to the ward. That mismatch is itself the finding.
- "Why only one ward?" → Extraction works for all 24; K/East is the pilot for the demo.
- "Is the data current?" → Latest closed actuals are 2023-24 for every ward. The gap is the point.

## Submission description (493 characters)
Where My Ward's Money Goes shows Mumbai residents what their BMC ward was allotted, what it actually spent,
and on which services, year by year. Ward-level spending is never published; we extracted it from
RTI-sourced Praja Foundation reports and BMC budget PDFs. Residents see utilisation per service, compare to
Mumbai, flag work they cannot see on the ground, and generate a ready-to-file RTI application with the exact
figures. Open data, cited, no login. Pilot ward: K/East Andheri.

## Sources
- https://praja.org/praja_docs/praja_downloads/Report%20on%20Wardwise%20Budget%20in%20Mumbai%202025.pdf
- https://data.opencity.in/dataset/bmc-budget-2026-27
- https://data.opencity.in/dataset/bmc-election-results-2026
- https://www.freepressjournal.in/mumbai/praja-foundation-report-reveals-sharp-decline-in-funds-allocated-to-bmc-wards
- https://www.freepressjournal.in/mumbai/know-your-ward-all-you-need-to-know-about-mumbais-k-east-ward-68-82-ahead-of-bmc-elections-2026
- https://www.pressreader.com/india/hindustan-times-st-mumbai/20221122/281724093551403
