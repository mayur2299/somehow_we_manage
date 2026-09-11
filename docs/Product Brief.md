# Where My Ward's Money Goes — Product Brief

**Team:** Somehow We Manage · CREATE 2026 · 11 September 2026

**One line.** Your ward's budget, what was actually spent, and one tap to ask the BMC why.

**Who it is for.** Any Mumbai resident. No login, no jargon, works on a phone.

## The problem

The BMC spends about ₹74,000 crore a year, but a resident cannot find out what their own ward was
given or what it spent. The budget is a thousand pages of PDF organised by department, not by
neighbourhood. Ward-level spending is never published. The share of the budget reaching wards has
fallen from 18% to 11% in five years while the total nearly doubled. Today, finding out what your
ward spent on drains means filing an RTI and doing the maths yourself.

## What the product does

Pick your ward and see three things in thirty seconds:

1. **How much was allotted and how much was actually spent**, year by year, with the utilisation
   percentage. Andheri East was given ₹321 crore in 2023-24 and spent ₹546 crore.
2. **Where it went**, across the six services people feel every day: garbage, roads, drains, health,
   parks, markets. Each shows allotted vs spent, cost per resident, and how the ward compares to
   Mumbai. Drains in Andheri East ran at 519% of budget.
3. **What to do about it.** Two buttons on every service.
   - *Flag it:* "this was budgeted but I don't see it on the ground", with a photo, counted publicly.
   - *Ask the BMC:* a pre-filled Right to Information application with the exact figures, ready to
     file. The ward office must answer within 30 days.

## How it works

Ward actuals are not public. Praja Foundation obtained them under RTI and published them in a PDF
report. We extracted every table programmatically and joined it with the BMC's own budget documents.
All data is open and cited on the page. Built on Nuxt and Netlify. No paid services, no AI, no keys.

## Why this is new

- Praja's report is a static annual PDF.
- Civic apps (MyNagarSevak, Mumbai Civic Tracker) route complaints but never show money.
- The BMC portal shows departments, not wards.
- Nobody has connected allocation, actual spend and a citizen action in one place, at ward level.

## The hard part

Turning an unpublished, RTI-sourced dataset locked inside PDFs into a per-ward drill-down, and
closing the loop so a number on the screen becomes a legal question the BMC has to answer.

## Honesty built in

- Actual spend is closed two years after allocation, so the latest two years show estimates and say so.
- The BMC does not publish project lists, delays or penalties. The page states that plainly.
  Example: in 2022 a contractor was fined ₹1 lakh on a ₹24 crore drain project.
- Utilisation above 100% means the ward spent more than allotted, usually money booked to the ward
  by central departments. Expect a judge to ask this.

## The close

Every Mumbai resident pays for their ward. This is the first time they can see what they got for it,
and ask when they did not.

## Demo flow (under 2 minutes)

1. Open the page. Read the hook: 18% → 11%.
2. Headline: given ₹321 cr, spent ₹546 cr, 170%.
3. Scroll the allotted vs spent chart. Point at the estimate-only years.
4. Tap **Storm water drains**: 519%. Read the one-sentence comparison to Mumbai.
5. Tap **I don't see this on the ground**, add a photo, flag it. Count appears on the chip.
6. Tap **Ask the BMC**. Show the RTI filled with the real figures. Copy.
7. Scroll to **Every number we have**. Then **What the BMC does not publish**.
8. Close line.

## Submission description (493 characters)

Where My Ward's Money Goes shows Mumbai residents what their BMC ward was allotted, what it actually
spent, and on which services, year by year. Ward-level spending is never published; we extracted it
from RTI-sourced Praja Foundation reports and BMC budget PDFs. Residents see utilisation per service,
compare to Mumbai, flag work they cannot see on the ground, and generate a ready-to-file RTI
application with the exact figures. Open data, cited, no login. Pilot ward: K/East Andheri.

## Sources

- Praja Foundation, Report on Ward-wise Budget in Mumbai 2025 —
  https://praja.org/praja_docs/praja_downloads/Report%20on%20Wardwise%20Budget%20in%20Mumbai%202025.pdf
- BMC Budget Estimates 2026-27 via OpenCity — https://data.opencity.in/dataset/bmc-budget-2026-27
- Free Press Journal on ward share 18% → 11% —
  https://www.freepressjournal.in/mumbai/praja-foundation-report-reveals-sharp-decline-in-funds-allocated-to-bmc-wards
- Hindustan Times, ₹1 lakh fine on ₹24 crore nullah work (22 Nov 2022) —
  https://www.pressreader.com/india/hindustan-times-st-mumbai/20221122/281724093551403
