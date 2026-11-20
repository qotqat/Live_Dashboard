# Trendire live dashboard

A private, per-account dashboard for the client's Amazon Associates Egypt data at
`https://trendiregroup.com`. Visitors must sign in with their **email and
mobile number** (from the client's login sheet). Every account is linked to
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

There is no signup page and no email+password form. Login uses the client's
login sheet:

- Login sheet: `19mcpmB9GmarXFNS9M0VtWpidrFh24DTA6EczCgH_lX4`
  (tab `Submissions`; override with `LOGIN_SHEET_ID` / `LOGIN_SHEET_TAB`).
- Enter the account's **email + mobile number**. The login-sheet row is
  matched by email; the typed mobile must match the sheet's `Mobile` value
  (see "Phone matching" below). Duplicates resolve to the latest row
  (by `Submitted At`).
- The account username is taken from the login sheet's `Full Name (EN)`
  column.
- The dashboard data is filtered by the tracking ID matched by email against
  the `Access` tab of the main spreadsheet (`11IF3Af7...`).
- On the first login the account has no password: the app asks you to set one
  (8–200 characters, stored with `scrypt`). Later logins use email + mobile +
  password.
- Login is rate-limited to 10 failed attempts per IP + email in 15 minutes.
- Deleting a user's row from `data/auth.db` frees their email for a new
  login. The login sheet and the `Access` tab remain the sources of truth.

## Phone matching

Egyptian mobiles are matched tolerantly:

- Non-digits are stripped (spaces, dashes, parentheses).
- A leading `+20` is handled: digits starting with `20` become the trunk
  form, e.g. `+201147241732` → `01147241732`.
- Otherwise the digits as typed are compared, with a last-9-digits fallback
  so trailing variants still match.

## Data source

- Spreadsheet: `11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78`
- `data` tab: metrics (`gid=1651395657`)
- `Payments` tab: payment history, filtered by the signed-in tracking ID
- `Commission` tab: commission rates
- `Access` tab: email → tracking ID map (login source for new accounts)
- Export URL:
  `https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=<gid>`
- The sheet must remain readable by anyone with the link.
- Dashboard data is cached for 5 minutes (`revalidate = 300`); the page
  refreshes itself every 60 seconds while the tab is visible.

## Login sheet

- Spreadsheet: `19mcpmB9GmarXFNS9M0VtWpidrFh24DTA6EczCgH_lX4`
  (tab `Submissions`).
- Overrides: `LOGIN_SHEET_ID`, `LOGIN_SHEET_TAB`.
- Fetched fresh (`cache: "no-store"`) on every login attempt; no caching.
- Used columns: `Email` (login identity), `Mobile` (login match),
  `Full Name (EN)` (username for new accounts).

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

- Login is by email + mobile from the client's login sheet; there is no
  signup page and no email+password form.
- New accounts have an empty password hash; after email+mobile login the user
  sets a password once (`scrypt` from `node:crypto`). Later logins verify
  email + mobile + password.
- Tracking ID for the dashboard: matched by email against the `Access` tab.
- Passwords are hashed with `scrypt` from `node:crypto` and a per-user random
  salt.
- Sessions are opaque random tokens stored in SQLite. Only a SHA-256 hash of the
  token is stored in the database.
- The session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
  Sessions last 30 days and expired rows are cleaned up on login.
- Login is rate-limited to 10 failed attempts per IP + email in 15 minutes.
- `src/proxy.ts` performs an optimistic cookie-presence check and redirects
  logged-out visitors to `/login`. Pages and the JSON API still verify the
  session against SQLite before returning any data.

## Structure

| Path | Purpose |
|---|---|
| `src/lib/report.ts` | Fetch the CSV tabs, map Amazon headers, parse money/dates, apply the 50% share, read the Access allowlist and the login sheet |
| `src/lib/phone.ts` | Egyptian mobile matching for login |
| `src/lib/metrics.ts` | Ranges, totals, daily/weekly/monthly series, tracking-ID breakdown |
| `src/lib/format.ts` | Locale-aware dates, numbers, and EGP formatting |
| `src/lib/i18n.ts` | English and Arabic dictionaries, locale normalisation, and translation helpers |
| `src/lib/locale-server.ts` | Read the `lang` cookie on the server |
| `src/lib/db.ts` | SQLite connection, `users` and `sessions` tables |
| `src/lib/auth.ts` | Password hashing, sessions, validation, rate limiting, user lookups |
| `src/app/actions/auth.ts` | Login, password set-up, and logout server actions |
| `src/app/login/page.tsx` | Login page |
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
