import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import AutoRefresh from "@/components/AutoRefresh";
import { DailyTable } from "@/components/DailyTable";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MonthlyTable } from "@/components/MonthlyTable";
import { PerformanceChart } from "@/components/PerformanceChart";
import { TrackingTable } from "@/components/TrackingTable";
import { UserMenu } from "@/components/UserMenu";
import { WeeklyTable } from "@/components/WeeklyTable";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import {
  currency,
  dayLabel,
  dayLabelY,
  monthLabel,
  num,
} from "@/lib/format";
import {
  fill,
  getDictionary,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import {
  METRICS,
  dailySeries,
  delta,
  latestDate,
  monthlySeries,
  parseRange,
  selectRange,
  totals,
  trackingSeries,
  weeklySeries,
} from "@/lib/metrics";
import {
  loadReport,
  type PaymentRow,
  type ReportSnapshot,
} from "@/lib/report";

type PageProps = {
  searchParams: Promise<{ p?: string | string[]; tab?: string | string[] }>;
};

function Header({
  checkedAt,
  dict,
  locale,
  user,
}: {
  checkedAt?: string;
  dict: Dictionary;
  locale: Locale;
  user: AuthUser;
}) {
  return (
    <header>
      <div className="bar-in">
        <div className="brand">
          <UserMenu user={user} dict={dict} />
          <div className="brand-copy">
            <span className="logo">{dict.brand.title}</span>
            <span className="logo-sub">{dict.brand.subtitle}</span>
          </div>
        </div>
        <div className="acts">
          <span className={checkedAt ? "live-pill" : "live-pill offline"}>
            <span className="live-dot" />
            {checkedAt ? dict.live : dict.offline}
          </span>
          <LanguageToggle
            locale={locale}
            label={dict.language.switchLabel}
            ariaLabel={dict.language.switchAria}
          />
        </div>
      </div>
    </header>
  );
}

function Frame({
  children,
  checkedAt,
  dict,
  locale,
  user,
}: {
  children: ReactNode;
  checkedAt?: string;
  dict: Dictionary;
  locale: Locale;
  user: AuthUser;
}) {
  return (
    <div className="app">
      <Header checkedAt={checkedAt} dict={dict} locale={locale} user={user} />
      <main>{children}</main>
    </div>
  );
}

function paymentStatus(status: string, dict: Dictionary): string {
  const value = status.trim().toLowerCase();
  if (value === "paid") return dict.payments.statusPaid;
  if (value === "validated") return dict.payments.statusValidated;
  if (value === "pending" || value === "new") return dict.payments.statusPending;
  return status || "—";
}

function paymentDate(value: string, locale: Locale): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return dayLabelY(`${match[1]}-${match[2]}-${match[3]}`, locale);
  }
  return value || "—";
}

function paymentMonth(value: string, locale: Locale): string {
  if (/^\d{4}-\d{2}$/.test(value)) return monthLabel(value, locale);
  return value || "—";
}

function paymentAmount(payment: PaymentRow, locale: Locale): string {
  return payment.amount == null
    ? "—"
    : `${num(payment.amount)} ${currency(locale)}`;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params.p) ? params.p[0] : params.p;
  const tabValue = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab =
    tabValue === "pay" || tabValue === "rates" ? tabValue : "perf";

  const range = parseRange(rangeValue);
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  let snapshot: ReportSnapshot | null = null;
  let loadError: string | null = null;

  try {
    snapshot = await loadReport();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Unknown loading error.";
  }

  if (!snapshot) {
    return (
      <Frame dict={dict} locale={locale} user={user}>
        <AutoRefresh />
        <div className="card error-card">
          <h1>{dict.errors.loadTitle}</h1>
          <p className="sub">{loadError}</p>
          <p className="muted">{dict.errors.sheetUnavailable}</p>
        </div>
      </Frame>
    );
  }

  if (snapshot.rows.length === 0) {
    return (
      <Frame
        checkedAt={snapshot.fetchedAt}
        dict={dict}
        locale={locale}
        user={user}
      >
        <AutoRefresh />
        <div className="card error-card">
          <h1>{dict.errors.emptyTitle}</h1>
          <p className="sub">{dict.errors.emptyBody}</p>
        </div>
      </Frame>
    );
  }

  const userTracking = user.trackingId.trim().toLowerCase();
  const rows = snapshot.rows.filter(
    (row) => row.trackingId.trim().toLowerCase() === userTracking,
  );

  if (rows.length === 0) {
    return (
      <Frame
        checkedAt={snapshot.fetchedAt}
        dict={dict}
        locale={locale}
        user={user}
      >
        <AutoRefresh />
        <div className="card error-card">
          <h1>{dict.errors.noUserDataTitle}</h1>
          <p className="sub">
            {fill(dict.errors.noUserDataBody, {
              trackingId: user.trackingId,
            })}
          </p>
        </div>
      </Frame>
    );
  }

  const dataTo = latestDate(rows);
  const selection = selectRange(rows, range);
  const currentTotals = totals(selection.current);
  const previousTotals = totals(selection.previous);
  const daily = dailySeries(selection.current);
  const weeks = weeklySeries(rows);
  const months = monthlySeries(rows);
  const allTotals = totals(rows);
  const tracking = trackingSeries(selection.current);
  const hasPrevious = selection.previous.length > 0;

  const trackingLabels = Object.fromEntries(
    rows.map((row) => [row.trackingId, user.username]),
  );

  const userPayments = snapshot.payments
    .filter(
      (payment) =>
        payment.trackingId.trim().toLowerCase() === userTracking,
    )
    .sort((a, b) => b.month.localeCompare(a.month));

  const pendingPayment = userPayments
    .filter((payment) => payment.status.trim().toLowerCase() !== "paid")
    .sort((a, b) => a.month.localeCompare(b.month))[0];

  const lastPaid = userPayments.find(
    (payment) => payment.status.trim().toLowerCase() === "paid",
  );

  const rangeOptions = [
    { key: "mtd", label: dict.ranges.mtd },
    { key: "7d", label: dict.ranges.d7 },
    { key: "all", label: dict.ranges.all },
  ] as const;

  const tabs = [
    { key: "perf", label: dict.tabs.perf },
    { key: "pay", label: dict.tabs.payments },
    { key: "rates", label: dict.tabs.commissions },
  ] as const;

  return (
    <Frame
      checkedAt={snapshot.fetchedAt}
      dict={dict}
      locale={locale}
      user={user}
    >
      <AutoRefresh />

      <div className="hello">
        <div>
          <h1>{dict.hero.title}</h1>
          <p className="sub">
            {fill(dict.hero.userSub, { username: user.username })}
          </p>
        </div>
        <span className="asof">
          {dataTo
            ? fill(dict.hero.asOf, { date: dayLabelY(dataTo, locale) })
            : dict.hero.noData}
        </span>
      </div>

      <div className="tabs">
        <nav className="tabs-in" aria-label={dict.tabs.label}>
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={
                item.key === "perf" ? "/?tab=perf" : `/?tab=${item.key}`
              }
              className={tab === item.key ? "tab active" : "tab"}
              aria-current={tab === item.key ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "perf" ? (
        <>
          <div className="period-block">
            <nav className="chips" aria-label={dict.ranges.label}>
              {rangeOptions.map((option) => {
                const active = range === option.key;
                return (
                  <Link
                    key={option.key}
                    href={
                      option.key === "mtd"
                        ? "/?tab=perf"
                        : `/?tab=perf&p=${option.key}`
                    }
                    className={active ? "chip active" : "chip"}
                    aria-current={active ? "page" : undefined}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </nav>
            {selection.start && selection.end ? (
              <div className="range">
                {fill(dict.range, {
                  start: dayLabel(selection.start, locale),
                  end: dayLabel(selection.end, locale),
                })}
              </div>
            ) : null}
          </div>

          <div className="tiles">
            {METRICS.map((metric) => {
              const value = currentTotals[metric.key];
              const change = hasPrevious
                ? delta(value, previousTotals[metric.key])
                : null;

              return (
                <div className="tile" key={metric.key}>
                  <div className="k">{dict.metrics[metric.key]}</div>
                  <div className="v">
                    {num(value)}
                    {metric.money ? (
                      <small> {currency(locale)}</small>
                    ) : null}
                  </div>
                  {change !== null ? (
                    <div className="d">
                      <span
                        className={change >= 0 ? "up" : "down"}
                        dir="ltr"
                      >
                        {change >= 0 ? "▲ " : "▼ "}
                        {Math.abs(Math.round(change))}%
                      </span>{" "}
                      {dict.comparedTo}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <PerformanceChart
            points={daily}
            start={selection.start}
            end={selection.end}
            dict={dict}
            locale={locale}
          />

          <section className="card">
            <h2>{dict.daily.title}</h2>
            <DailyTable
              days={daily}
              totals={currentTotals}
              dict={dict}
              locale={locale}
            />
          </section>

          <section className="card">
            <h2>{dict.weekly.title}</h2>
            <WeeklyTable weeks={weeks} dict={dict} locale={locale} />
          </section>

          <section className="card">
            <h2>{dict.monthly.title}</h2>
            <MonthlyTable
              months={months}
              dataTo={dataTo}
              totals={allTotals}
              dict={dict}
              locale={locale}
            />
          </section>

          <section className="card">
            <h2>{dict.tracking.title}</h2>
            <p className="sub card-sub">{dict.tracking.sub}</p>
            <TrackingTable
              items={tracking}
              totalEarnings={currentTotals.earnings}
              dict={dict}
              labels={trackingLabels}
            />
          </section>
        </>
      ) : null}

      {tab === "pay" ? (
        <>
          <div className="pay-grid">
            <div className="card pay-card">
              <div className="k">{dict.payments.next}</div>
              {pendingPayment ? (
                <>
                  <div className="m">
                    {paymentMonth(pendingPayment.month, locale)} ·{" "}
                    {paymentStatus(pendingPayment.status, dict)}
                  </div>
                  <div className="amt">
                    {paymentAmount(pendingPayment, locale)}
                  </div>
                  <p className="muted">
                    {dict.payments.expected}:{" "}
                    {paymentDate(pendingPayment.expected, locale)}
                  </p>
                </>
              ) : (
                <div className="m">{dict.payments.noNext}</div>
              )}
            </div>

            <div className="card pay-card">
              <div className="k">{dict.payments.last}</div>
              {lastPaid ? (
                <>
                  <div className="m">
                    {paymentMonth(lastPaid.month, locale)} ·{" "}
                    {paymentStatus(lastPaid.status, dict)}
                  </div>
                  <div className="amt">{paymentAmount(lastPaid, locale)}</div>
                  <p className="muted">
                    {dict.payments.paid}:{" "}
                    {paymentDate(lastPaid.paid, locale)}
                  </p>
                </>
              ) : (
                <>
                  <div className="m">{dict.payments.noLast}</div>
                  <p className="muted">{dict.payments.noLastHint}</p>
                </>
              )}
            </div>
          </div>

          <section className="card">
            <h2 className="card-sub">{dict.payments.history}</h2>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>{dict.payments.month}</th>
                    <th className="n">{dict.payments.amount}</th>
                    <th>{dict.payments.status}</th>
                    <th>{dict.payments.expected}</th>
                    <th>{dict.payments.paid}</th>
                    <th>{dict.payments.note}</th>
                  </tr>
                </thead>
                <tbody>
                  {userPayments.length > 0 ? (
                    userPayments.map((payment, index) => (
                      <tr
                        key={`${payment.month}-${payment.status}-${index}`}
                      >
                        <td>{paymentMonth(payment.month, locale)}</td>
                        <td className="n">
                          {paymentAmount(payment, locale)}
                        </td>
                        <td>{paymentStatus(payment.status, dict)}</td>
                        <td>{paymentDate(payment.expected, locale)}</td>
                        <td>{paymentDate(payment.paid, locale)}</td>
                        <td>{payment.note || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="empty" colSpan={6}>
                        {dict.payments.empty}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {tab === "rates" ? (
        <section className="card">
          <h2>{dict.rates.title}</h2>
          <p className="sub card-sub">{dict.rates.sub}</p>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>{dict.rates.category}</th>
                  <th className="n">{dict.rates.rate}</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.rates.length > 0 ? (
                  snapshot.rates.map((rate, index) => (
                    <tr key={`${rate[0]}-${index}`}>
                      <td>{rate[0]}</td>
                      <td className="n">
                        {Math.round(Number(rate[1]) * 1000) / 10}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty" colSpan={2}>
                      {dict.rates.empty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <footer className="footnotes">
        {dict.footer.source ? (
          <p className="foot">{dict.footer.source}</p>
        ) : null}
        {dict.footer.basis ? (
          <p className="foot">{dict.footer.basis}</p>
        ) : null}
      </footer>
    </Frame>
  );
}
