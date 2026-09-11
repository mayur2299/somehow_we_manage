# Ward Data: Format and Extraction Prompt

The site loads one JSON file per ward. K/East is the reference: `app/data/k-east.json`.
Deliver one file per ward, same shape, plus an index. Numbers are **₹ crore** unless stated.
Use `null` for "not published yet", never 0.

## Deliverable

```
wards/
  index.json          # list of all wards
  k-east.json         # one per ward, slug = lowercase code, "/" → "-"  (K/E → k-east, G/N → g-north, A → a)
  g-north.json
  ...
```

### index.json
```json
[
  { "slug": "k-east", "code": "K/E", "name": "Andheri East", "zone": "Western Suburbs", "population2025": 867906 }
]
```

### <slug>.json
```json
{
  "code": "K/E",
  "name": "Andheri East",
  "areas": "Andheri East, Marol, Sakinaka, Chakala, Vile Parle East, Jogeshwari East",
  "population2025": 867906,
  "slumPopulation": 403800,
  "slumShare": 0.49,
  "years": ["2021-22", "2022-23", "2023-24", "2024-25", "2025-26"],
  "note": "Actual spend is only closed two years after allocation. 2024-25 and 2025-26 show budget estimates only.",

  "total":   { "label": "Total ward budget",
               "ward":   { "be": [337, 281, 321, 394, 388], "actual": [446, 409, 546, null, null], "perCapita": 5439 },
               "mumbai": { "be": [6963, 6718, 7651, 7996, 7984], "actual": [8840, 9026, 10344, null, null], "perCapita": 7250 } },
  "revenue": { "label": "Day-to-day running (revenue)",
               "ward":   { "be": [252, 260, 274, 373, 370], "actual": [334, 323, 390, null, null], "perCapita": 4065 } },
  "capital": { "label": "New works (capital)",
               "ward":   { "be": [85, 22, 47, 21, 19], "actual": [112, 86, 156, null, null], "perCapita": 1373 },
               "mumbai": { "be": [1927, 1138, 1606, 915, 1105], "actual": [2846, 1691, 2882, null, null], "perCapita": 1907 } },
  "propertyTax": { "actual": [529, 538, 318], "perCapita": 5377 },

  "services": [
    { "key": "swm",     "label": "Garbage collection", "icon": "🗑️", "be": [106,108,104,152,163], "actual": [102,110,115,null,null], "avgUtil": 1.03, "perCapita": 1875, "fact": "313 tonnes of garbage lifted every day", "mumbaiAvgUtil": null },
    { "key": "roads",   "label": "Roads",              "icon": "🛣️", "be": [25,15,21,27,34],      "actual": [30,39,39,null,null],    "avgUtil": 1.90, "perCapita": 394,  "fact": "133 km of roads in the ward",           "mumbaiAvgUtil": 1.63 },
    { "key": "swd",     "label": "Storm water drains", "icon": "🌧️", "be": [4.5,4.5,5.7,1.7,5.8], "actual": [26.0,24.1,24.9,null,null], "avgUtil": 5.19, "perCapita": 67, "fact": "174 km of roadside drains",        "mumbaiAvgUtil": 3.83 },
    { "key": "health",  "label": "Health services",    "icon": "🏥", "be": [13,14,15,30,24],      "actual": [62,21,59,null,null],    "avgUtil": 3.46, "perCapita": 282,  "fact": "24 municipal dispensaries",            "mumbaiAvgUtil": 2.07 },
    { "key": "parks",   "label": "Parks and gardens",  "icon": "🌳", "be": [12,12,13,17,17],      "actual": [10,12,13,null,null],    "avgUtil": 0.94, "perCapita": 192,  "fact": "",                                     "mumbaiAvgUtil": 1.00 },
    { "key": "markets", "label": "Markets",            "icon": "🧺", "be": [1.1,1.0,1.0,1.6,1.6], "actual": [2.1,1.5,1.3,null,null], "avgUtil": 1.58, "perCapita": 18,   "fact": "5 municipal markets",                  "mumbaiAvgUtil": 0.86 }
  ],
  "slumImprovement": { "be": [33.3, 15.8, 19.3, 11.0, 7.4], "changePct": -78 },

  "pincodes": [ { "pin": "400059", "area": "Marol, Andheri East" } ],

  "accountable": {
    "electedOn": "16 January 2026",
    "administratorPeriod": "March 2022 to January 2026",
    "administratorNote": "For almost four years the BMC had no elected council. ...",
    "electoralWards": "68 to 82",
    "electoralWardsSource": { "name": "...", "url": "..." },
    "kNorthNote": "",
    "kNorthSource": null,
    "corporators": [ { "ward": 68, "name": "Rohan Shashindra Rathod", "party": "BJP", "votes": 12992, "nowKNorth": false } ],
    "wardOffice": { "title": "Assistant Municipal Commissioner, K/East", "address": "...", "phone": "022-...", "note": "The RTI on this page is addressed to this office." },
    "mlas": [ { "constituency": "Andheri East", "name": "Murji Patel", "party": "Shiv Sena" } ],
    "mayor": { "name": "Ritu Tawde", "party": "BJP" },
    "roadContractorNote": "..."
  },

  "cityContext": { "wardShare2021": 18, "wardShare2025": 11, "bmcBudget2021": 39027, "bmcBudget2025": 74367,
                   "notPublished": ["..."], "penaltyExample": { "text": "...", "url": "...", "source": "..." } },
  "sources": [ { "name": "...", "url": "..." } ]
}
```

### Rules
- `be` and `actual` arrays are **always length 5**, aligned to `years`. Actuals for 2024-25 and 2025-26 are `null`.
- `avgUtil` = sum(actual 3 yrs) / sum(be 3 yrs), as a ratio (1.90 = 190%). Compute it, don't copy the report's rounding.
- `perCapita` in **₹ per resident per year** (rupees, not crore), as printed in the report.
- Service `key` values are fixed: `swm`, `roads`, `swd`, `health`, `parks`, `markets`. Do not rename.
- `mumbaiAvgUtil` is the same ratio for the "Mumbai" total row of that table, or `null` if the table has none.
- Party names as printed on the results CSV, shortened: BJP, SS (UBT), Shiv Sena, Congress, MNS, NCP (SP), Independent.
- `cityContext` and `sources` are identical across wards; copy from k-east.json.
- Keep 1 decimal max. Use `null`, not empty strings, for unknown numbers.

## Where each field comes from

| Field | Source | Table / column |
|---|---|---|
| total.ward / total.mumbai | Praja report | Table 6: BE, A per year; "Mumbai" row; Average Per Capita |
| revenue.ward | Praja | Table 4 |
| capital.ward / capital.mumbai | Praja | Table 5 |
| propertyTax | Praja | Table 3: property tax actuals 3 yrs + per capita |
| services swm | Praja | Table 7 (SWM): BE A pairs ×3, BE 24-25, BE 25-26, Avg U%, Per Capita, Population, Garbage/day → `fact` |
| services swd | Praja | Table 8: same + SWD km → `fact` |
| services roads | Praja | Table 9: same + road km → `fact` |
| services parks | Praja | Table 10 |
| services markets | Praja | Table 11: no. of markets → `fact` |
| services health | Praja | Table 12: no. of dispensaries → `fact` |
| slumImprovement | Praja | Table 14: 5 BE years + % change; slumPopulation, slumShare from same table |
| population2025 | Praja | "Projected Population for 2025" column, any service table |
| corporators | OpenCity CSV | BMC Election Results 2026, filter Ward No. to the admin ward's electoral range |
| electoralWards range | Free Press Journal "Know Your Ward" series, Dec 2025 | one article per admin ward, title carries the range |
| wardOffice | mcgm.gov.in ward pages, or majhaward.com/ward/<code> | address, phone |
| mlas | Wikipedia assembly constituency pages / majhaward | constituencies overlapping the ward |
| pincodes | India Post pincode list for Mumbai, mapped by locality | 5–10 per ward |

Praja PDF: https://praja.org/praja_docs/praja_downloads/Report%20on%20Wardwise%20Budget%20in%20Mumbai%202025.pdf
Election CSV: https://data.opencity.in/dataset/bmc-election-results-2026 (columns: Ward No., Elected Candidate Name, Party, Valid Votes Received)

Praja's tables extract cleanly with `pdfplumber` (`page.extract_text()` gives one row per ward, e.g. `K/E 85 112 133% 22 86 396% 47 156 332% 21 19 1,373`). Column order per table is in the header lines just above the "Island City" marker.

---

## Prompt to hand over

Paste this into a fresh Claude Code session in a folder containing the Praja PDF and the election CSV:

> I need one JSON file per BMC administrative ward (all 24: A, B, C, D, E, F/N, F/S, G/N, G/S, H/E, H/W, K/E, K/W, L, M/E, M/W, N, P/N, P/S, R/C, R/N, R/S, S, T) in exactly the schema in `Data Format and Extraction Prompt.md`, plus `index.json`. Reference file: `k-east.json`, already done and correct; match it field for field.
>
> Sources are in this folder: the Praja Foundation "Report on Wardwise Budget in Mumbai 2025" PDF and the OpenCity "BMC Election Results 2026" CSV. Use `pdfplumber` to extract Tables 3–14 from the PDF; each ward is one text row per table, and the column order is in the header just above the "Island City" line on that page. The field-to-table mapping is in the document. Do not OCR; the PDF is text.
>
> For each ward: fill every numeric field from the PDF; compute `avgUtil` as sum of 3-year actuals over sum of 3-year BE; set 2024-25 and 2025-26 actuals to `null`; copy `cityContext` and `sources` from `k-east.json` unchanged. For corporators, use the Free Press Journal "Know Your Ward" article for that ward to get the electoral ward range, then filter the CSV. If you cannot verify a ward's electoral range, leave `corporators: []` and note it in a `todo` field rather than guessing. Same for `wardOffice`, `mlas`, `pincodes`: fill from the sources listed, else leave empty and add to `todo`.
>
> Validate before finishing: every `be`/`actual` array has length 5; every service key is one of swm, roads, swd, health, parks, markets; `slug` matches the filename; numbers are numbers, not strings. Print a one-line summary per ward: slug, total BE 2023-24, total actual 2023-24, utilisation %, corporator count, and any `todo` items. Then zip `wards/` for handover.
