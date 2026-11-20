# Trendire live dashboard

A private, per-account dashboard for the client's Amazon Associates Egypt data at
`https://trendiregroup.com`. Visitors must sign in. Every account is linked to
one tracking ID and sees only that tracking ID's rows, payments, and totals.

Arabic is the default language (RTL); the header button switches to English
(LTR) and stores the choice in a `lang` cookie.

## Run

```powershell
cd "N:\repos\live dashboard\web"
npm.cmd install
npm.cmd run dev
```

Open <http://localhost:3000>. Logged-out visitors are redirected to `/login`.

Production build check:

```powershell
npm.cmd run build
npm.cmd run start
```

## Accounts and access

Accounts are **not open signup**. Activation validates against the `Access` tab
of the client's Google Sheet:

- The email must exist in `Access` and its `Active` cell must be checked
  (`TRUE`, `Yes`, `1`, or an Arabic equivalent).
- The submitted tracking ID must equal the `Tracking Id` on that same row.
- A tracking ID can be claimed by one account only.
- Emails and usernames are unique (case-insensitive).
- The user chooses a password of at least 8 characters.
- The username is chosen during activation and is shown in the dashboard.

To admit a new influencer:

1. Add their row in the `Access` tab with their email, tracking ID, and an
   active/checked `Active` value.
2. Ask them to open `/signup` and complete the activation form.

The `Access` tab is fetched fresh on every activation attempt, so newly added
rows work immediately.

There is no email-based password reset yet. An administrator can reset an
account by stopping the app, removing the user's row from `data/auth.db` with a
SQLite tool, and letting the user activate again. The tracking ID becomes
available once the row is removed.

## Data source

- Spreadsheet: `11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78`
- `data` tab: metrics (`gid=1651395657`)
- `Payments` tab: payment history, filtered by the signed-in tracking ID
- `Commission` tab: commission rates
- `Access` tab: activation allowlist
- Export URL:
  `https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=<gid>`
- The sheet must remain readable by anyone with the link.
- Dashboard data is cached for 5 minutes (`revalidate = 300`); the page
  refreshes itself every 60 seconds while the tab is visible.

Override the source without editing code:

```powershell
$env:SHEET_ID="..."
$env:SHEET_GID="..."
npm.cmd run dev
```

Earnings use the influencer share of Amazon's reported commission
(`INFLUENCER_SHARE = 0.5`).

## Interface

- The Amazon logo in the header opens an account menu with the account name,
  email, username, tracking ID, and sign-out.
- The performance tab shows KPI tiles, a metric chart, daily/weekly/monthly
  tables, and a username breakdown for the signed-in account only.
- The payments tab shows the next payment, last paid payment, and payment
  history for the signed-in account.
- The commission tab shows the commission rates.
- Period presets: current month, last 7 days, all time.
- Amazon-inspired teal/orange palette, Cairo font, rounded KPI tiles, compact
  tables, and automatic dark mode via `prefers-color-scheme`.
- Mobile daily-detail cards replace the wide table below 700px; the weekly,
  monthly, and tracking tables scroll horizontally.

## Authentication design

- Passwords are hashed with `scrypt` from `node:crypto` and a per-user random
  salt.
- Sessions are opaque random tokens stored in SQLite. Only a SHA-256 hash of the
  token is stored in the database.
- The session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
  Sessions last 30 days and expired rows are cleaned up on login/activation.
- Login is rate-limited to 10 failed attempts per IP + email in 15 minutes.
- `src/proxy.ts` performs an optimistic cookie-presence check and redirects
  logged-out visitors to `/login`. Pages and the JSON API still verify the
  session against SQLite before returning any data.

## Structure

| Path | Purpose |
|---|---|
| `src/lib/report.ts` | Fetch the CSV tabs, map Amazon headers, parse money/dates, apply the 50% share, read the allowlist |
| `src/lib/metrics.ts` | Ranges, totals, daily/weekly/monthly series, tracking-ID breakdown |
| `src/lib/format.ts` | Locale-aware dates, numbers, and EGP formatting |
| `src/lib/i18n.ts` | English and Arabic dictionaries, locale normalisation, and translation helpers |
| `src/lib/locale-server.ts` | Read the `lang` cookie on the server |
| `src/lib/db.ts` | SQLite connection, `users` and `sessions` tables |
| `src/lib/auth.ts` | Password hashing, sessions, validation, rate limiting |
| `src/app/actions/auth.ts` | Login, activation, and logout server actions |
| `src/app/login/page.tsx` | Login page |
| `src/app/signup/page.tsx` | Account activation page |
| `src/app/page.tsx` | Authenticated, per-account dashboard page |
| `src/app/api/dashboard/route.ts` | Session-protected JSON snapshot |
| `src/proxy.ts` | Optimistic redirect for logged-out visitors |
| `src/app/globals.css` | All styling and responsive rules |
| `src/components/UserMenu.tsx` | Clickable logo and account menu |
| `src/components/PerformanceChart.tsx` | Direction-aware SVG bar chart with metric picker |
| `src/components/DailyTable.tsx` | Daily table plus mobile cards |
| `src/components/WeeklyTable.tsx` | Weekly summary |
| `src/components/MonthlyTable.tsx` | Monthly summary |
| `src/components/TrackingTable.tsx` | Earnings share by username |
| `src/components/LanguageToggle.tsx` | Sets the language cookie and refreshes |
| `src/components/AutoRefresh.tsx` | 60-second client refresh, paused when the tab is hidden |

The SQLite file is created automatically at `data/auth.db`; the `data/`
directory is gitignored. Set `AUTH_DB_PATH` to use another location.

## Deployment notes

The site runs on a small VPS. Treat deployment as a manual operation:

1. Install Node.js 20.9+ and build tools for the native `better-sqlite3`
   module (or use a prebuilt binary for the installed Node version).
2. Install dependencies with `npm ci` and build with `npm run build`.
3. Make sure the process can write to `data/` (or to `AUTH_DB_PATH`).
4. Start with `npm run start` behind the existing HTTPS reverse proxy. The
   session cookie is marked `Secure` in production, so serve the site over
   HTTPS.
5. Back up `data/auth.db` (and its `-wal`/`-shm` files, or stop the app before
   copying) alongside the code.

Do not copy `node_modules` from a Windows machine to the VPS; install
dependencies on the server so the SQLite binary matches the server platform.

## Parsing notes

- Amazon headers arrive doubled, for example `datedate` and
  `total_earningstotal_earnings`; headers are normalised before matching.
- Money arrives as `EGP898,543.50`; the currency prefix and commas are removed
  before parsing.
- Dates arrive as `17 Nov 2026`; they are parsed explicitly to avoid locale
  surprises.
- Rows without a tracking ID or a valid date (including the report total row)
  are skipped.
- The signed-in account's tracking ID is compared case-insensitively.

## Current limitations

- No email-based password reset, admin UI, roles, or audit log.
- The source currently contains a small number of data rows across a few dates,
  so trends are sparse.
- Deltas are only shown when the previous comparable period contains data.
