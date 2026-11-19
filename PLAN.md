# Live Data Dashboard — Project Plan

**Prepared:** 17 November 2026  
**Updated:** 19 November 2026 — local prototype restyled, bilingual UI verified  
**Status:** Local prototype ready for review. Deployment is blocked on a VPS public IP.  
**Project directory:** `N:\repos\live dashboard`

> The dashboard is **public and read-only**. Anyone with the URL can view it;
> viewers never log in. The data is confirmed **non-sensitive**. The source is
> the **`data` tab only** of the client's Google Sheet. Admin, auth, and audit
> pages are **out of scope**; future operations will use SSH and application
> logs.

## 1. Summary

Build a public dashboard at `https://trendiregroup.com` that presents the
client's Amazon Associates Egypt performance from the Google Sheet `data` tab.
The page shows current KPIs, period comparisons, a daily chart, daily detail,
weekly and monthly summaries, and a breakdown by tracking ID.

The local prototype is complete and tested. It reads the public CSV export with
a 5-minute server cache and refreshes the browser every 60 seconds. It defaults
to Arabic (RTL), includes an English LTR toggle, and adapts the visual language of the
client's Apps Script portal: Cairo font, teal and Amazon-orange palette, rounded
cards, compact tables, and automatic dark mode.

Deployment is deferred. No VPS exists yet, so there is no public IPv4 to put in
DNS. The domain remains parked at GoDaddy until the server is provisioned.

## 2. Confirmed decisions

| Area | Answer | Implication |
|---|---|---|
| Visibility | Public read-only (D6 resolved) | No viewer login, no viewer accounts, no admin pages. |
| Source | Google Sheets `data` tab (D1a resolved) | Read the CSV export for `gid=1651395657`; ignore every other tab. |
| Data classification | Non-sensitive (confirmed) | Curated metrics and history can be public. |
| Freshness | 5 minutes | Server fetch cache is 300 seconds; the page refreshes every 60 seconds while visible. |
| History | Source rows to date | No database in the local prototype. Persistence is a separate decision if the sheet stops being sufficient. |
| Language | Arabic default + English toggle | Arabic is RTL by default; English switches the whole page to LTR and persists in a `lang` cookie. |
| Design | Adapted from `code.md` | Cairo font, teal `#00808f` brand, Amazon orange `#ff9900` accent, 12px cards, pills, compact tables. |
| Domain | `trendiregroup.com` root on GoDaddy (D9) | No subdomain. Keep the `www` CNAME. Replace parking A records only after a VPS IP exists. |
| Hosting | VPS, deferred (D2a open) | Docker/Caddy target can be decided when the server is available. No DNS change before then. |
| Stack | Next.js 16.4.6, React 19.3.1, plain CSS | Server rendering plus one small client chart and refresh component. No database yet. |

## 3. Current local implementation

### Data path

1. The server requests the public CSV export of the `data` tab.
2. The parser maps doubled Amazon headers (for example `datedate` and
   `total_earningstotal_earnings`).
3. Money (`EGP898,543.50`), percentages (`137.50%`), and dates
   (`17 Nov 2026`) are normalised.
4. Rows without a tracking ID or a valid date are skipped, including the report
   total row.
5. Duplicate `date + tracking ID` rows are collapsed, keeping the greatest
   `web_scraper_order`.
6. Metrics are aggregated for the selected period and rendered on the server.

### Displayed metrics

- Orders, shipped orders, sales, shipped sales, and earnings.
- Clicks, conversion rate, returns, and returned earnings are present in the
  parsed data; the main KPI set follows the client's Apps Script design.
- Period presets: current month, last 7 days, and all time.
- Delta chips compare with the previous comparable period when data exists.
- Daily performance chart with a metric selector.
- Daily detail table plus mobile cards.
- Weekly and monthly summaries.
- Tracking-ID breakdown with earnings share.

### Verified sample totals

Source snapshot: 6 data rows, 3 tracking IDs (`egypt06-21`,
`trendire101-21`, `a0ce3c-21`), dates 10 and 14–17 November 2026.

| Metric | Value |
|---|---:|
| Orders | 5,492 |
| Shipped orders | 5,967 |
| Sales | EGP 982,962 |
| Shipped sales | EGP 1,010,562 |
| Earnings | EGP 107,708 |
| Clicks | 50,166 |
| Product conversion | 10.9% |
| Returned items | 275 |
| Returned earnings | EGP 5,789 |

### Verification performed

- `npm.cmd run build` passes, including TypeScript checks.
- The page renders real data at `http://localhost:3000`.
- Arabic is the default for visitors with no cookie; English and Arabic layouts
  both render, the language cookie survives period navigation in both
  directions, and the page title switches with the language.
- Arabic RTL chart ordering, axis placement, and table alignment were checked.
- Mobile daily cards, horizontal table scrolling, and the 60-second refresh
  component are in place.
- Browser console has no errors or warnings.
- Light-mode desktop, dark-mode, mobile (390px and 500px), and Arabic desktop
  captures were reviewed; the layout does not overflow horizontally.

## 4. Data contract

### Sheet

- Spreadsheet ID: `11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78`
- Tab: `data` (`gid=1651395657`)
- Access: anyone with the link can read; no authentication.
- Header row: Amazon Associates export headers, currently doubled.
- One row per date per tracking ID in the current extract.
- The report total row is ignored because it has no valid date.

### Fields used

| Field | Use |
|---|---|
| Tracking ID | Grouping and breakdown |
| Date | Daily, weekly, monthly, and range grouping |
| Items ordered | Orders KPI |
| Items shipped | Shipped KPI |
| Ordered revenue | Sales KPI |
| Items shipped revenue | Shipped sales KPI |
| Total earnings | Earnings KPI and share |
| Clicks | Tracking breakdown |
| Product conversion | Available in the parsed row |
| Commission rate | Available in the parsed row |
| Returned revenue / earnings / items | Available in the parsed row |

Header order may change; columns are located by normalised name, not position.

### Rules

- Required columns: tracking ID, date, items ordered, ordered revenue, total
  earnings, and clicks.
- If a required column disappears, the page shows an error instead of partial
  data.
- If Google returns an HTML sign-in page, the page shows an error and keeps the
  last rendered response in the browser cache; it never displays raw HTML.
- Duplicate rows are deduplicated by `date + tracking ID`.
- The sheet must remain a single table with one header row.

## 5. Design system

- **Typography:** Cairo from `next/font/google`, weights 400–700.
- **Palette:** `#f5f6f7` background, white cards, `#0f1111` text, `#565959`
  muted, `#d5d9d9` lines, `#00808f` brand, `#ff9900` accent, `#067d62` positive,
  `#b12704` negative.
- **Dark mode:** automatic via `prefers-color-scheme`, with a matching teal
  `#2bb3c0` brand and dark surfaces.
- **Components:** rounded 12px cards, pill chips, KPI tiles, compact tables,
  status/live pill, language button, and an SVG bar chart.
- **Responsive:** single column at all widths; KPI tiles reflow; daily table
  becomes cards below 700px; wide summary tables scroll horizontally.
- **Accessibility:** visible focus states, semantic headings, table headers,
  labelled controls, and keyboard-reachable navigation.

## 6. Hosting and DNS

### Current state

- No VPS has been provisioned.
- The domain is registered at GoDaddy.
- Nameservers: `ns39.domaincontrol.com`, `ns40.domaincontrol.com`.
- Root has two GoDaddy parking `A` records:
  `3.33.130.190` and `15.197.148.33`.
- `www` is a CNAME to the root; there is no `MX` record.
- DNS must not be changed until a public IPv4 exists.

### When a VPS is available

Minimum suggested specification:

- Ubuntu 24.04 LTS, 2 vCPU, 4 GB RAM, 40 GB SSD.
- Node.js 22 LTS, Docker Engine and Compose, Caddy for HTTPS.
- SSH key-only access, firewall allowing only 22/80/443.
- Outbound HTTPS to Google.

DNS change:

1. Delete **both** parked `A @` records.
2. Add one `A @` pointing to the VPS IPv4, TTL 600.
3. Keep `www` CNAME, `NS`, `SOA`, `_domainconnect`, and `_dmarc` unchanged.
4. Verify with `Resolve-DnsName trendiregroup.com -Server 8.8.8.8`.
5. Issue certificates for `trendiregroup.com` and
   `www.trendiregroup.com`; enable HSTS after both work.

## 7. Next steps

1. Client reviews the restyled local dashboard in English and Arabic.
2. Confirm the KPI set and whether clicks, conversion, and returns should be
   promoted to headline tiles.
3. Decide whether history must be persisted outside the sheet. The current six
   rows do not require a database; a growing sheet may.
4. Provision the VPS and provide its public IP, SSH access, and owner.
5. Deploy the Next.js app behind Caddy, then change GoDaddy DNS.
6. Add uptime/freshness monitoring and a documented restart/rollback process.
7. If the source grows, move ingestion to a scheduled worker or add a snapshot
   table; the page contract stays the same.

## 8. Acceptance criteria for this phase

- [x] Public page loads without login.
- [x] Only the `data` tab is read.
- [x] Totals reconcile with the source rows.
- [x] Five-minute data cache and 60-second UI refresh.
- [x] Arabic default and English LTR toggle.
- [x] Responsive layout with mobile daily cards.
- [x] Light and dark themes.
- [x] Production build and TypeScript checks pass.
- [ ] Client sign-off on design and KPI order.
- [ ] VPS provisioned and production URL live. *(Blocked: no server/IP.)*

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No VPS or public IP | Launch slips; domain stays parked | Keep local prototype; do not touch DNS until an IP exists. |
| Google Sheet access changes | Empty or error page | Show a clear error; keep the sheet readable by link; monitor. |
| Headers change | Required-column error | Match by normalised header aliases; surface the missing columns. |
| Scraper appends duplicate blocks | Double counting | Deduplicate by `date + tracking ID` using `web_scraper_order`. |
| Only six source rows | Sparse chart and missing deltas | Show empty states; extend history in the sheet or add persistence. |
| Sheet grows very large | Slow reads and cell limits | Move to a worker plus database when volume warrants it. |
| Design and data change together | Harder review | Review language, KPI order, and visual design separately from deployment. |

## 10. Out of scope

- Viewer or admin authentication, sessions, roles, audit logs.
- Admin dashboards, manual ingest controls, and user management.
- Database storage or a public data API for this phase.
- Editing the source sheet from the dashboard.
- Subdomains, email changes, or DNS edits before a VPS exists.
