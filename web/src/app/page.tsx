import Link from "next/link";
import type { ReactNode } from "react";

import AutoRefresh from "@/components/AutoRefresh";
import { DailyTable } from "@/components/DailyTable";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MonthlyTable } from "@/components/MonthlyTable";
import { PerformanceChart } from "@/components/PerformanceChart";
import { TrackingTable } from "@/components/TrackingTable";
import { WeeklyTable } from "@/components/WeeklyTable";
import { currency, dayLabel, dayLabelY, num } from "@/lib/format";
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
import { loadReport, type ReportSnapshot } from "@/lib/report";

type PageProps = {
  searchParams: Promise<{ p?: string | string[] }>;
};

function Header({
  checkedAt,
  dict,
  locale,
}: {
  checkedAt?: string;
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <header>
      <div className="bar-in">
        <div className="brand">
          <span className="logo-mark" aria-hidden="true">
            T
          </span>
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
}: {
  children: ReactNode;
  checkedAt?: string;
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <div className="app">
      <Header checkedAt={checkedAt} dict={dict} locale={locale} />
      <main>{children}</main>
    </div>
  );
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params.p) ? params.p[0] : params.p;
  const range = parseRange(rangeValue);
  const locale = await getLocale();
  const dict = getDictionary(locale);

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
      <Frame dict={dict} locale={locale}>
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
      <Frame checkedAt={snapshot.fetchedAt} dict={dict} locale={locale}>
        <AutoRefresh />
        <div className="card error-card">
          <h1>{dict.errors.emptyTitle}</h1>
          <p className="sub">{dict.errors.emptyBody}</p>
        </div>
      </Frame>
    );
  }

  const dataTo = latestDate(snapshot.rows);
  const selection = selectRange(snapshot.rows, range);
  const currentTotals = totals(selection.current);
  const previousTotals = totals(selection.previous);
  const daily = dailySeries(selection.current);
  const weeks = weeklySeries(snapshot.rows);
  const months = monthlySeries(snapshot.rows);
  const allTotals = totals(snapshot.rows);
  const tracking = trackingSeries(selection.current);
  const hasPrevious = selection.previous.length > 0;
  const rangeOptions = [
    { key: "mtd", label: dict.ranges.mtd },
    { key: "7d", label: dict.ranges.d7 },
    { key: "all", label: dict.ranges.all },
  ] as const;

  return (
    <Frame checkedAt={snapshot.fetchedAt} dict={dict} locale={locale}>
      <AutoRefresh />

      <div className="hello">
        <div>
          <h1>{dict.hero.title}</h1>
          <p className="sub">{dict.hero.sub}</p>
        </div>
        <span className="asof">
          {dataTo
            ? fill(dict.hero.asOf, { date: dayLabelY(dataTo, locale) })
            : dict.hero.noData}
        </span>
      </div>

      <div className="period-block">
        <nav className="chips" aria-label={dict.ranges.label}>
          {rangeOptions.map((option) => {
            const active = range === option.key;
            return (
              <Link
                key={option.key}
                href={option.key === "mtd" ? "/" : `/?p=${option.key}`}
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
                {metric.money ? <small> {currency(locale)}</small> : null}
              </div>
              {change !== null ? (
                <div className="d">
                  <span className={change >= 0 ? "up" : "down"} dir="ltr">
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
        />
      </section>

      <footer className="footnotes">
        <p className="foot">{dict.footer.source}</p>
        <p className="foot">{dict.footer.basis}</p>
      </footer>
    </Frame>
  );
}
