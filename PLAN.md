# Live Data Dashboard — Project Plan

**Prepared:** 17 November 2026  
**Updated:** 20 November 2026 — private per-account dashboards implemented locally  
**Status:** Authentication and per-account filtering are built and verified locally. The updated app is ready for the user to upload to the VPS.  
**Project directory:** `N:\repos\live dashboard`

> The dashboard is **private**. Visitors must sign in. Each account is linked to
> one tracking ID from the Google Sheet `Access` tab and sees only that tracking
> ID's data. Arabic remains the default language. The source is the `data`,
> `Payments`, and `Commission` tabs; `Access` supplies the dashboard tracking ID.

## 1. Summary

Build a private dashboard at `https://trendiregroup.com` that presents each
Amazon Associates Egypt influencer with their own performance, earnings, and
payment history. Accounts log in with email + mobile from the client's login
sheet; the dashboard is linked to the Access-tab tracking ID.

The dashboard keeps the existing visual language: Cairo font, teal and Amazon
orange palette, rounded cards, compact tables, automatic dark mode, Arabic RTL
by default, and an English LTR toggle. Data is cached for five minutes and the
page refreshes every 60 seconds while visible.

## 2. Confirmed decisions

| Area | Decision | Implication |
|---|---|---|
| Visibility | Private, login required | All pages redirect to `/login` without a valid session. |
| Login | Email + mobile from the login sheet; `Access` supplies the dashboard tracking ID | Tracking IDs are unique per account. |
| Account identity | Username from the login sheet's `Full Name (EN)`; password set on first login | Username replaces the tracking ID in the account-facing table. |
| Data scope | One tracking ID per account | Totals, chart, tables, and payments are filtered server-side. |
| Storage | SQLite via `better-sqlite3` | Small file-backed database for users and sessions; no Postgres or ORM. |
| Sessions | Opaque random token, SHA-256 hash stored | HTTP-only, SameSite=Lax cookie; 30-day expiry; `Secure` in production. |
| Passwords | `scrypt` from `node:crypto` | Per-user salt; no external auth service. |
| Language | Arabic default + English toggle | Arabic is RTL by default; the choice persists in a `lang` cookie. |
| Data freshness | 5 minutes | Server fetch cache is 300 seconds; the page refreshes every 60 seconds while visible. |
| Earnings basis | 50% influencer share | Displayed earnings are half of Amazon's reported commission. |
| Hosting | Existing small VPS | 1 vCPU, 3 GB RAM, 40 GB NVMe; keep memory and disk use minimal. |
| Design | Adapted from `code.md` | Cairo font, teal `#00808f`, Amazon orange `#ff9900`, 12px cards, pills, compact tables. |
| Deployment | Manual upload by the user | Do not commit or push until the user explicitly says so. |

## 3. Current implementation

### Authentication and accounts

- `/login` signs in with **email + mobile number**.
- The login sheet (`Submissions` tab of `19mcpmB9GmarXFNS9M0VtWpidrFh24DTA6EczCgH_lX4`,
  fetched fresh on every attempt) is the source of truth for login rows:
  `Email` (identity), `Mobile` (match), `Full Name (EN)` (username for new
  accounts). Duplicates resolve to the latest row by `Submitted At`.
-Egyptian mobiles are matched tolerantly: leading `20` is treated as the
  `+20` international prefix (`+201147241732` → `01147241732`), plus a
  last-9-digits fallback.
- Existing users: their password (scrypt-hashed in `users.password_hash`) is
  verified with email + mobile + password. New users: the account is created
  on login (username = login sheet `Full Name (EN)`, tracking ID = `Access`
  row matched by email), with an empty password; the user then sets one on
  the set-password screen.
- The tracking ID for the dashboard is matched by email against the `Access`
  tab of the main spreadsheet.
- Usernames, emails, and tracking IDs are unique (case-insensitive).
- Login failures are limited to 10 per IP + email in a 15-minute window.
- `src/proxy.ts` redirects requests without a session cookie to `/login`. Pages
  and `/api/dashboard` re-check the session against SQLite before returning any
  data.
- The Amazon logo opens a menu showing the account name, email, username,
  tracking ID, and sign-out.

### Data path

1. The server requests the public CSV export of the `data` tab.
2. Amazon's doubled headers are mapped by name, not position.
3. Money, percentages, and dates are normalised.
4. Rows without a tracking ID or a valid date are skipped.
5. The signed-in tracking ID is matched case-insensitively and only those rows
   are aggregated.
6. Payments are filtered by the same tracking ID; commission rates are shared.
7. Metrics are aggregated and rendered on the server.

### Displayed metrics

- Orders, shipped orders, sales, shipped sales, and earnings.
- Clicks, conversion rate, returns, and returned earnings are available in the
  parsed data; the headline KPI set follows the client's Apps Script design.
- Period presets: current month, last 7 days, and all time.
- Delta chips compare with the previous comparable period when data exists.
- Daily performance chart with a metric selector.
- Daily detail table plus mobile cards.
- Weekly and monthly summaries.
- Username breakdown for the signed-in account.
- Payments tab with next payment, last paid payment, and history.
- Commission tab with category rates.

### Verified sample totals

Source snapshot: six data rows, three tracking IDs (`egypt06-21`,
`trendire101-21`, `a0ce3c-21`), dates 10 and 14–17 November 2026. Totals below
use the 50% influencer share.

| Metric | Value |
|---|---:|
| Orders | 5,492 |
| Shipped orders | 5,967 |
| Sales | EGP 982,962 |
| Shipped sales | EGP 1,010,562 |
| Earnings | EGP 53,854 |
| Clicks | 50,166 |

### Verification performed

- `npm.cmd run build` passes, including TypeScript checks.
- Logged-out `/` redirects to `/login`; `/api/dashboard` returns 401.
- Login succeeds for a login-sheet row (email + mobile) with a tracking ID in
  `Access`; new accounts get a set-password step; bad data is rejected.
- Login, logout, and session persistence work.
- Two accounts with different tracking IDs see different totals; no cross-account
  rows or payments were observed.
- Arabic is the default; English switches the layout to LTR and updates copy.
- The logo loads from `/images/logo.png` and opens the account menu.
- The tracking table shows the username instead of the raw tracking ID.
- Payments and commission tabs render with their empty and populated states.
- Browser console has no errors.

## 4. Access model

### `Access` tab fields used

| Field | Use |
|---|---|
| Email | Matched against the login sheet row and stored on the account |
| Tracking Id | Matched by email to supply the dashboard filter |
| Active | Informational for the new phone-login model |

### Login sheet fields used (`Submissions` tab)

| Field | Use |
|---|---|
| Full Name (EN) | Username for newly created accounts |
| Email | Login identity (case-insensitive) |
| Mobile | Login match against the typed mobile |
| Submitted At | Latest row wins on duplicates |

### Rules

- A login sheet row with a matching email and mobile is required.
- Existing users log in with email + mobile + password. New users set a
  password on the set-password screen after their first email + mobile match.
- A tracking ID from `Access` is required to create a new account
  (the dashboard filters by it).
- Removing a user row from `data/auth.db` frees the email for a new login.
  There is no self-service password reset yet.

## 5. Data contract

### Sheet

- Spreadsheet ID: `11IF3Af7LdxbvJzheqFWW_fLq3VkCxNejbRPyDyFlH78`
- `data` tab: `gid=1651395657`
- `Payments`, `Commission`, and `Access` tabs: read by name through `gviz`.
- Access: anyone with the link can read; no Google authentication.
- The sheet must remain a single table per tab with one header row.

### Fields used from `data`

| Field | Use |
|---|---|
| Tracking ID | Account filter and grouping |
| Date | Daily, weekly, monthly, and range grouping |
| Items ordered | Orders KPI |
| Items shipped | Shipped KPI |
| Ordered revenue | Sales KPI |
| Items shipped revenue | Shipped sales KPI |
| Total earnings | Earnings KPI (multiplied by 0.5) |
| Clicks | Tracking breakdown |
| Product conversion | Available in the parsed row |
| Commission rate | Available in the parsed row |
| Returned revenue / earnings / items | Available in the parsed row |

Header order may change; columns are located by normalised name.

## 6. Hosting and DNS

### Current state

- The VPS is provisioned: 1 vCPU, 3 GB RAM, 40 GB NVMe.
- `https://trendiregroup.com` serves the application.
- The updated build, `public/images` assets, dependencies, and `data/` directory
  still need to be uploaded/installed by the user.
- Deployment remains manual; no SSH credentials are stored in this repository.

### Deployment checklist

1. Upload or pull the updated app files.
2. Run `npm ci` on the server so `better-sqlite3` matches the server platform.
3. Run `npm run build`.
4. Ensure the process can write to `data/` or the path in `AUTH_DB_PATH`.
5. Restart the Node process behind the existing HTTPS reverse proxy.
6. Verify `/login` with an allowlisted email + mobile, per-account totals, the
   logo menu, and logout.
7. Back up `data/auth.db` together with its WAL files, or stop the app before
   copying.

### Resource notes

- SQLite is file-backed and uses a small cache (about 2 MB).
- Sessions are cleaned up on login.
- Google Sheets fetches are cached for five minutes to avoid hitting the API on
  every page refresh.
- No containers, Postgres, Redis, or background workers are required.

## 7. Next steps

1. User reviews the local phone login, set-password flow, and per-account dashboard.
2. User uploads the updated build and runs `npm ci` / `npm run build` on the VPS.
3. Verify the live logo, login, per-account isolation, and logout.
4. Confirm whether password reset or an admin user-management screen is needed.
5. Add uptime/freshness monitoring and a documented restart/rollback process.
6. Only after explicit approval: commit the changes; push/deploy when instructed.

## 8. Acceptance criteria

- [x] Logged-out visitors are redirected to `/login`; the dashboard is private.
- [x] Accounts log in via email + mobile from the login sheet.
- [x] Each tracking ID can be claimed once; email and username are unique.
- [x] Login, logout, and HTTP-only session cookies work.
- [x] Dashboard totals, tables, chart, and payments are filtered per account.
- [x] Tracking-table header and values use usernames.
- [x] Amazon logo renders, is clickable, and opens the account menu.
- [x] Arabic default and English LTR toggle.
- [x] Five-minute data cache and 60-second UI refresh.
- [x] Production build and TypeScript checks pass.
- [ ] Live deployment of this update verified by the user.
- [ ] Client sign-off on the private dashboard flow.

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Native `better-sqlite3` binary mismatch | Server fails to start | Run `npm ci` on the VPS; do not copy `node_modules` from Windows. |
| `data/` not writable | Login fails | Create the directory with correct ownership or set `AUTH_DB_PATH`. |
| Forgotten passwords | User locked out | Admin removes the user row and the user logs in again via the login sheet; plan a reset flow if needed. |
| Google Sheet access changes | Empty or error page | Keep tabs readable by link; surface clear errors; monitor. |
| Headers change | Missing-column error | Match by normalised aliases; surface the missing column. |
| Allowlist changes | Stale tracking ID | `Access` is fetched fresh on every new user creation; existing sessions are not revoked automatically. |
| SQLite file lost | Accounts and sessions lost | Back up `data/auth.db` and WAL files; users can log in again via the login sheet. |
| Small VPS | Memory pressure | File-backed SQLite, 2 MB cache, no workers or heavy services. |
| Sparse source data | Missing trends/deltas | Show empty states; extend history in the sheet if needed. |

## 10. Out of scope

- Open registration, roles, and admin user-management screens.
- Email-based password reset or email verification.
- Editing the source sheet from the dashboard.
- Storing or editing payment records.
- Audit logs, multi-device session management, and SSO.
