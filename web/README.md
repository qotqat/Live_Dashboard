# Trendire live dashboard — local prototype

A public, read-only dashboard for the client's Amazon Associates Egypt data.
It reads the **`data` tab only** of the client's Google Sheet, renders current
KPIs and historical totals, and supports English and Arabic. There is no
database, no viewer login, and no admin area.

## Run

```powershell
cd "N:\repos\live dashboard\web"
npm.cmd install
npm.cmd run dev
```

Open <http://localhost:3000>.

Production build check:

```powershell
npm.cmd run build
npm.cmd run start
```

## Data source

- Spreadsheet: `11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78`
- Tab: `1651395657` (the `data` tab; every other tab is ignored)
- Export URL:
  `https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=<gid>`
- The sheet must remain readable by anyone with the link.
- Data is cached for 5 minutes (`revalidate = 300`); the page refreshes itself
  every 60 seconds while the tab is visible.

Override the source without editing code:

```powershell
$env:SHEET_ID="..."
$env:SHEET_GID="..."
npm.cmd run dev
```

## Interface

- Default language is Arabic (RTL). The header button switches to English
  (LTR) and stores the choice in a `lang` cookie. New visitors with no cookie
  see Arabic.
- Amazon-inspired teal/orange palette, Cairo font, rounded KPI tiles, compact
  tables, and automatic dark mode via `prefers-color-scheme`.
- Period presets: current month, last 7 days, all time.
- Mobile daily-detail cards replace the wide table below 700px; the weekly,
  monthly, and tracking tables scroll horizontally.

## Structure

| Path | Purpose |
|---|---|
| `src/lib/report.ts` | Fetch the CSV, map Amazon headers, parse money/dates, dedupe rows |
| `src/lib/metrics.ts` | Ranges, totals, daily/weekly/monthly series, tracking-ID breakdown |
| `src/lib/format.ts` | Locale-aware dates, numbers, and EGP formatting |
| `src/lib/i18n.ts` | English and Arabic dictionaries, locale normalisation, and translation helpers |
| `src/lib/locale-server.ts` | Read the `lang` cookie on the server |
| `src/app/page.tsx` | Server-rendered dashboard page |
| `src/app/globals.css` | All styling and responsive rules |
| `src/components/PerformanceChart.tsx` | Direction-aware SVG bar chart with metric picker |
| `src/components/DailyTable.tsx` | Daily table plus mobile cards |
| `src/components/WeeklyTable.tsx` | Weekly summary |
| `src/components/MonthlyTable.tsx` | Monthly summary |
| `src/components/TrackingTable.tsx` | Earnings share by tracking ID |
| `src/components/LanguageToggle.tsx` | Sets the language cookie and refreshes |
| `src/components/AutoRefresh.tsx` | 60-second client refresh, paused when the tab is hidden |

## Parsing notes

- Amazon headers arrive doubled, for example `datedate` and
  `total_earningstotal_earnings`; headers are normalised before matching.
- Money arrives as `EGP898,543.50`; the currency prefix and commas are removed
  before parsing.
- Dates arrive as `17 Nov 2026`; they are parsed explicitly to avoid locale
  surprises.
- Rows are deduplicated by `date + tracking ID`, keeping the row with the
  greatest `web_scraper_order`. This prevents double counting when the scraper
  appends a full block on every run.
- Rows without a tracking ID or a valid date (including the report total row)
  are skipped.

## Current limitations

- The source currently contains six data rows across five dates (10 and
  14–17 Nov 2026), so the trend is sparse.
- Deltas are only shown when the previous comparable period contains data.
- Deployment is deferred until the client provides a VPS public IP. DNS must
  stay unchanged until then.
